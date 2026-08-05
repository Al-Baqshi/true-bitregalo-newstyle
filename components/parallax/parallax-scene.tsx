"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export interface ParallaxLayer {
  /** Image path (transparent PNG, or black-background art with additive: true) */
  src: string
  /** pixelWidth / pixelHeight of the asset */
  aspect: number
  /** Plane width in world units */
  width: number
  /** Base [x, y, z] position */
  position: [number, number, number]
  /** Mouse parallax factor — bg ~0.06, mid ~0.2, fg ~0.38 */
  parallax: number
  /** Draw order — lower is further back */
  order: number
  /** Horizontal scroll drift (negative = left) */
  scrollFX?: number
  /** Vertical scroll drift (positive = up) */
  scrollFY?: number
  /** Additive blending: black pixels become invisible, glows composite */
  additive?: boolean
  opacity?: number
}

interface ParallaxSceneProps {
  layers: ParallaxLayer[]
  className?: string
}

export function ParallaxScene({ layers, className }: ParallaxSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef(layers)
  layersRef.current = layers

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative"
    }

    const specs = layersRef.current
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const canvas = document.createElement("canvas")
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;"
    container.appendChild(canvas)

    let W = container.offsetWidth || 1
    let H = container.offsetHeight || 1

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Radial falloff mask so additive planes fade to nothing at their edges
    // instead of showing the source image's rectangular boundary.
    const vignetteCanvas = document.createElement("canvas")
    vignetteCanvas.width = vignetteCanvas.height = 512
    const vctx = vignetteCanvas.getContext("2d")!
    const grad = vctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    grad.addColorStop(0, "#fff")
    grad.addColorStop(0.6, "#fff")
    grad.addColorStop(1, "#000")
    vctx.fillStyle = grad
    vctx.fillRect(0, 0, 512, 512)
    const vignetteTex = new THREE.CanvasTexture(vignetteCanvas)

    const meshes: THREE.Mesh[] = []
    let disposed = false
    let rafId = 0
    let visible = true
    let needsStaticRender = true

    let tX = 0, tY = 0, cX = 0, cY = 0
    let scrollProg = 0, smoothScrollProg = 0

    const loader = new THREE.TextureLoader()
    specs.forEach((spec) => {
      loader.load(spec.src, (tex) => {
        if (disposed) { tex.dispose(); return }
        tex.colorSpace = THREE.SRGBColorSpace
        const geo = new THREE.PlaneGeometry(spec.width, spec.width / spec.aspect)
        const mat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          opacity: spec.opacity ?? 1,
          ...(spec.additive ? { blending: THREE.AdditiveBlending, alphaMap: vignetteTex } : {}),
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(...spec.position)
        mesh.renderOrder = spec.order
        mesh.userData.base = spec.position
        mesh.userData.pFactor = spec.parallax
        mesh.userData.scrollFX = spec.scrollFX ?? 0
        mesh.userData.scrollFY = spec.scrollFY ?? 0
        scene.add(mesh)
        meshes.push(mesh)
        needsStaticRender = true
      })
    })

    const onMouseMove = (e: MouseEvent) => {
      tX = (e.clientX / window.innerWidth - 0.5) * 2
      tY = -(e.clientY / window.innerHeight - 0.5) * 2
    }

    const updateScrollProg = () => {
      const rect = container.getBoundingClientRect()
      const vh = window.innerHeight
      const mid = rect.top + rect.height * 0.5
      scrollProg = (vh * 0.5 - mid) / (vh * 0.5 + rect.height * 0.5)
      scrollProg = Math.max(-1.4, Math.min(1.4, scrollProg))
    }

    const renderFrame = () => {
      for (const mesh of meshes) {
        const [bx, by] = mesh.userData.base as [number, number, number]
        const f = mesh.userData.pFactor as number
        mesh.position.x = bx + cX * f + mesh.userData.scrollFX * smoothScrollProg
        mesh.position.y = by + cY * f + mesh.userData.scrollFY * smoothScrollProg
      }
      camera.rotation.y = cX * 0.035
      camera.rotation.x = cY * 0.025
      renderer.render(scene, camera)
    }

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      if (!visible) return
      cX += (tX - cX) * 0.065
      cY += (tY - cY) * 0.065
      smoothScrollProg += (scrollProg - smoothScrollProg) * 0.06
      renderFrame()
    }

    const staticLoop = () => {
      rafId = requestAnimationFrame(staticLoop)
      if (needsStaticRender && visible) {
        needsStaticRender = false
        renderFrame()
      }
    }

    if (reducedMotion) {
      staticLoop()
    } else {
      document.addEventListener("mousemove", onMouseMove)
      window.addEventListener("scroll", updateScrollProg, { passive: true })
      updateScrollProg()
      animate()
    }

    const io = new IntersectionObserver(
      ([entry]) => { visible = entry.isIntersecting; needsStaticRender = true },
      { rootMargin: "100px" },
    )
    io.observe(container)

    const ro = new ResizeObserver(() => {
      W = container.offsetWidth || 1
      H = container.offsetHeight || 1
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
      needsStaticRender = true
    })
    ro.observe(container)

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("scroll", updateScrollProg)
      meshes.forEach((mesh) => {
        mesh.geometry.dispose()
        const mat = mesh.material as THREE.MeshBasicMaterial
        mat.map?.dispose()
        mat.dispose()
      })
      vignetteTex.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [])

  return <div ref={containerRef} className={className} style={{ overflow: "hidden" }} />
}
