"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Grid3x3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Quilt {
  id: number
  blob_url: string
  grid_rows: number
  grid_cols: number
  unique_patterns: number
  total_tiles: number
  downloaded_at: string
}

export default function GalleryPage() {
  const [quilts, setQuilts] = useState<Quilt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuilts()
  }, [])

  const fetchQuilts = async () => {
    try {
      console.log("[v0] Fetching quilts from API...")
      const response = await fetch("/api/quilts/list")
      const data = await response.json()
      console.log("[v0] Received quilts:", data)

      setQuilts(data.quilts || [])
      if (data.error) {
        setError(data.error)
      }
    } catch (error) {
      console.error("[v0] Error fetching quilts:", error)
      setError("Failed to load quilts. Please check your database connection.")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quilt Bot
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Quilt Gallery</h1>
          <p className="text-muted-foreground">Browse all downloaded quilts from the community</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading quilts...</p>
          </div>
        ) : quilts.length === 0 ? (
          <Card className="p-12 text-center">
            {error ? (
              <>
                <p className="text-destructive text-lg font-semibold mb-2">Database Setup Required</p>
                <p className="text-muted-foreground text-sm">{error}</p>
                <p className="text-muted-foreground text-sm mt-4">
                  Please run the SQL scripts in the <code className="bg-muted px-2 py-1 rounded">/scripts</code> folder
                  to create the required database tables.
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-lg">No quilts have been downloaded yet.</p>
                <p className="text-muted-foreground text-sm mt-2">Create and download a quilt to see it appear here!</p>
              </>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quilts.map((quilt) => (
              <Card key={quilt.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={quilt.blob_url || "/placeholder.svg"}
                    alt={`Quilt ${quilt.id}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Grid3x3 className="h-4 w-4" />
                    <span>
                      {quilt.grid_rows}×{quilt.grid_cols} grid
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">{quilt.unique_patterns}</span>
                    <span>unique patterns</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(quilt.downloaded_at)}</span>
                  </div>
                  <a href={quilt.blob_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                      View Full Size
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Designed by{" "}
          <a
            href="https://ivanling.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Ivan Ling
          </a>
        </div>
      </footer>
    </div>
  )
}
