import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface VisitorSession {
  sessionId: string
  firstVisit: Date
  lastVisit: Date
  generationCount: number
}

export async function getOrCreateSession(sessionId: string): Promise<VisitorSession> {
  console.log("[v0] Getting or creating session:", sessionId)

  try {
    // Try to get existing session
    const existing = await sql`
      SELECT session_id, first_visit, last_visit, generation_count 
      FROM visitors 
      WHERE session_id = ${sessionId}
    `

    if (existing.length > 0) {
      // Update last visit
      await sql`
        UPDATE visitors 
        SET last_visit = NOW() 
        WHERE session_id = ${sessionId}
      `

      console.log("[v0] Existing session found:", existing[0])
      return {
        sessionId: existing[0].session_id,
        firstVisit: new Date(existing[0].first_visit),
        lastVisit: new Date(),
        generationCount: existing[0].generation_count,
      }
    }

    // Create new session
    console.log("[v0] Creating new session")
    await sql`
      INSERT INTO visitors (session_id, first_visit, last_visit, generation_count)
      VALUES (${sessionId}, NOW(), NOW(), 0)
    `

    return {
      sessionId,
      firstVisit: new Date(),
      lastVisit: new Date(),
      generationCount: 0,
    }
  } catch (error) {
    console.error("[v0] Database error in getOrCreateSession:", error)
    return {
      sessionId,
      firstVisit: new Date(),
      lastVisit: new Date(),
      generationCount: 0,
    }
  }
}

export async function incrementGenerationCount(sessionId: string): Promise<number> {
  console.log("[v0] Incrementing generation count for:", sessionId)

  try {
    const result = await sql`
      UPDATE visitors 
      SET generation_count = generation_count + 1,
          last_visit = NOW()
      WHERE session_id = ${sessionId}
      RETURNING generation_count
    `

    const newCount = result[0]?.generation_count || 0
    console.log("[v0] New generation count:", newCount)
    return newCount
  } catch (error) {
    console.error("[v0] Database error in incrementGenerationCount:", error)
    return 0
  }
}

export async function getSessionStats(sessionId: string) {
  const result = await sql`
    SELECT session_id, first_visit, last_visit, generation_count 
    FROM visitors 
    WHERE session_id = ${sessionId}
  `

  if (result.length === 0) return null

  return {
    sessionId: result[0].session_id,
    firstVisit: new Date(result[0].first_visit),
    lastVisit: new Date(result[0].last_visit),
    generationCount: result[0].generation_count,
  }
}
