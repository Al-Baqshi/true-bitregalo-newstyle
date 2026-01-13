import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const whitepaperPath = path.join(
      process.cwd(),
      "app/docs/V4 BitRegalo Whitepaper-20260113130914.md"
    )
    const content = fs.readFileSync(whitepaperPath, "utf-8")
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error reading whitepaper:", error)
    return NextResponse.json({ error: "Failed to load whitepaper" }, { status: 500 })
  }
}
