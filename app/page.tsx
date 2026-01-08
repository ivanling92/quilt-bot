"use client"

import { useState, useEffect } from "react"
import { CameraCapture } from "@/components/camera-capture"
import { TileGallery } from "@/components/tile-gallery"
import { GridConfiguration } from "@/components/grid-configuration"
import { QuiltPreview } from "@/components/quilt-preview"
import { Button } from "@/components/ui/button"
import type { TileData } from "@/lib/types"
import { optimizeQuiltLayout } from "@/lib/optimization-algorithm"

export default function QuiltTilerPage() {
  const [tiles, setTiles] = useState<TileData[]>([])
  const [gridSize, setGridSize] = useState<{ rows: number; cols: number }>({ rows: 4, cols: 4 })
  const [optimizedLayout, setOptimizedLayout] = useState<number[][]>([])
  const [step, setStep] = useState<"capture" | "configure" | "preview">("capture")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [tileIdCounter, setTileIdCounter] = useState(0)
  const [randomSeed, setRandomSeed] = useState<number>(Date.now())

  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch("/api/analytics/session")
        const data = await response.json()
        console.log("[v0] Analytics session initialized:", data)
      } catch (error) {
        console.error("[v0] Failed to initialize analytics:", error)
      }
    }

    initSession()
  }, [])

  const trackGeneration = async () => {
    try {
      const response = await fetch("/api/analytics/track-generation", {
        method: "POST",
      })
      const data = await response.json()
      console.log("[v0] Generation tracked:", data)
    } catch (error) {
      console.error("[v0] Failed to track generation:", error)
    }
  }

  const addTile = (tile: TileData) => {
    setTileIdCounter((prev) => {
      const newId = prev + 1
      setTiles((currentTiles) => [...currentTiles, { ...tile, id: `tile-${Date.now()}-${newId}` }])
      return newId
    })
    setValidationError(null)
  }

  const updateTile = (id: string, updates: Partial<TileData>) => {
    setTiles((currentTiles) => currentTiles.map((tile) => (tile.id === id ? { ...tile, ...updates } : tile)))
    setValidationError(null)
  }

  const removeTile = (id: string) => {
    setTiles(tiles.filter((tile) => tile.id !== id))
  }

  const handleProceedToConfigure = () => {
    // Check if we have at least 3 tiles
    if (tiles.length < 3) {
      setValidationError("Please add at least 3 tile patterns before continuing.")
      return
    }

    // Check if any tile has invalid count (0 or negative)
    const invalidTiles = tiles.filter((tile) => !tile.count || tile.count < 1)
    if (invalidTiles.length > 0) {
      setValidationError("All tiles must have a quantity of at least 1.")
      return
    }

    setValidationError(null)
    setStep("configure")
  }

  const handleGenerateQuilt = (layout: number[][]) => {
    setOptimizedLayout(layout)
    setStep("preview")
    trackGeneration()
  }

  const handleRegenerate = () => {
    const newSeed = Date.now()
    setRandomSeed(newSeed)

    const newLayout = optimizeQuiltLayout(tiles, gridSize.rows, gridSize.cols, undefined, newSeed)
    setOptimizedLayout(newLayout)
    trackGeneration()
  }

  const handleLayoutUpdate = (newLayout: number[][]) => {
    setOptimizedLayout(newLayout)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Smart Quilt Tiler</h1>
          <p className="text-muted-foreground mt-1">AI-powered quilt pattern optimizer</p>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-8">
            <button
              onClick={() => setStep("capture")}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
                step === "capture"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-sm font-medium">1. Capture Tiles</span>
            </button>
            <button
              onClick={handleProceedToConfigure}
              disabled={tiles.length === 0}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                step === "configure"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-sm font-medium">2. Configure Grid</span>
            </button>
            <button
              onClick={() => setStep("preview")}
              disabled={optimizedLayout.length === 0}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                step === "preview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-sm font-medium">3. Preview Quilt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {step === "capture" && (
          <div className="space-y-8">
            <CameraCapture onCapture={addTile} />
            {tiles.length > 0 && <TileGallery tiles={tiles} onUpdate={updateTile} onRemove={removeTile} />}

            {tiles.length > 0 && (
              <div className="space-y-4">
                {validationError && (
                  <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 text-center">
                    {validationError}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={handleProceedToConfigure} size="lg" className="min-w-[200px]">
                    Next: Configure Grid
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "configure" && (
          <GridConfiguration
            tiles={tiles}
            gridSize={gridSize}
            onGridSizeChange={setGridSize}
            onGenerate={handleGenerateQuilt}
          />
        )}

        {step === "preview" && (
          <QuiltPreview
            tiles={tiles}
            layout={optimizedLayout}
            gridSize={gridSize}
            onLayoutUpdate={handleLayoutUpdate}
            onRegenerate={handleRegenerate}
          />
        )}
      </main>

      {/* Footer with designer credit */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Designed by{" "}
            <a
              href="https://ivanling.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Ivan Ling
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
