import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getOrCreateSession } from "@/lib/analytics"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    let sessionId = cookieStore.get("visitor_session_id")?.value

    // Generate new session ID if none exists
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      console.log("[v0] Generated new session ID:", sessionId)
    } else {
      console.log("[v0] Found existing session ID:", sessionId)
    }

    // Get or create session in database
    const session = await getOrCreateSession(sessionId)

    // Set cookie (expires in 1 week)
    const response = NextResponse.json({
      success: true,
      session,
    })

    response.cookies.set("visitor_session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week in seconds
      path: "/",
    })

    console.log("[v0] Session response sent with cookie")

    return response
  } catch (error) {
    console.error("[v0] Session error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
