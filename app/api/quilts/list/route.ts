import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Fetching quilts from database...")
    const sql = neon(process.env.DATABASE_URL!)

    const quilts = await sql`
      SELECT id, blob_url, grid_rows, grid_cols, unique_patterns, total_tiles, downloaded_at
      FROM quilts
      ORDER BY downloaded_at DESC
      LIMIT 100
    `

    console.log("[v0] Fetched quilts count:", quilts.length)
    return NextResponse.json({ quilts })
  } catch (error) {
    console.error("[v0] Error fetching quilts:", error)
    console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))

    // Return empty array instead of error so gallery UI works
    return NextResponse.json({
      quilts: [],
      error: "Database table may not exist. Please run the SQL scripts in the /scripts folder.",
    })
  }
}
