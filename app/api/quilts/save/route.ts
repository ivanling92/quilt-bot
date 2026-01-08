import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting quilt save process")

    const body = await request.json()
    const { imageData, gridRows, gridCols, uniquePatterns, totalTiles } = body

    if (!imageData) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 })
    }

    console.log("[v0] Image data received, grid:", gridRows, "x", gridCols)

    // Get session ID from cookies
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("visitor_session")?.value || "anonymous"

    console.log("[v0] Session ID:", sessionId)

    const base64Data = imageData.split(",")[1]
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: "image/jpeg" })

    console.log("[v0] Blob size:", blob.size)

    // Create a unique filename
    const filename = `quilt-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`

    // Upload to Blob storage
    console.log("[v0] Uploading to Blob storage...")
    const uploadedBlob = await put(filename, blob, {
      access: "public",
      contentType: "image/jpeg",
    })

    console.log("[v0] Uploaded to Blob:", uploadedBlob.url)

    // Save metadata to database
    try {
      const sql = neon(process.env.DATABASE_URL!)
      console.log("[v0] Inserting into database...")

      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'quilts'
        )
      `

      console.log("[v0] Quilts table exists:", tableCheck[0]?.exists)

      if (tableCheck[0]?.exists) {
        await sql`
          INSERT INTO quilts (session_id, blob_url, grid_rows, grid_cols, unique_patterns, total_tiles)
          VALUES (${sessionId}, ${uploadedBlob.url}, ${gridRows}, ${gridCols}, ${uniquePatterns}, ${totalTiles})
        `
        console.log("[v0] Successfully saved to database")
      } else {
        console.warn("[v0] Quilts table does not exist. Run /scripts/002_create_quilts_table.sql")
      }
    } catch (dbError) {
      console.error("[v0] Database error:", dbError)
      console.error("[v0] Error details:", dbError instanceof Error ? dbError.message : String(dbError))
      // Continue even if database insert fails
    }

    return NextResponse.json({ success: true, url: uploadedBlob.url })
  } catch (error) {
    console.error("[v0] Error saving quilt:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Failed to save quilt",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export const runtime = "nodejs"
