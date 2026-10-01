"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Match my device", icon: Monitor },
] as const

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

/** Compact control for a header: an icon that opens the three choices. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useMounted()
  const Icon = mounted && resolvedTheme === "dark" ? Moon : Sun
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change appearance"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring pointer-coarse:size-11",
          className
        )}
      >
        <Icon className="size-[1.15rem]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-48">
        <DropdownMenuRadioGroup value={mounted ? theme : undefined} onValueChange={setTheme}>
          {OPTIONS.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              <o.icon />
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The same choice laid out in full, for a settings sheet or a menu on a phone. */
export function ThemeChoice({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  return (
    <div role="radiogroup" aria-label="Appearance" className={cn("grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1", className)}>
      {OPTIONS.map((o) => {
        const active = mounted && theme === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-[560] transition-colors",
              active ? "bg-card text-foreground shadow-raised" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <o.icon className="size-4" />
            {o.value === "system" ? "Device" : o.label}
          </button>
        )
      })}
    </div>
  )
}
