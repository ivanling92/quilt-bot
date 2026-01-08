import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { incrementGenerationCount } from "@/lib/analytics"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("visitor_session_id")?.value

    console.log("[v0] Track generation - session ID:", sessionId)

    if (!sessionId) {
      console.log(
        "[v0] No session cookie found. Available cookies:",
        cookieStore.getAll().map((c) => c.name),
      )
      return NextResponse.json({ success: false, error: "No session found" }, { status: 400 })
    }

    const newCount = await incrementGenerationCount(sessionId)

    return NextResponse.json({
      success: true,
      generationCount: newCount,
    })
  } catch (error) {
    console.error("[v0] Track generation error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
