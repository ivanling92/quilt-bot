"use client"

import { useState } from "react"
import { Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { optimizeQuiltLayout } from "@/lib/optimization-algorithm"
import type { TileData } from "@/lib/types"

interface GridConfigurationProps {
  tiles: TileData[]
  gridSize: { rows: number; cols: number }
  onGridSizeChange: (size: { rows: number; cols: number }) => void
  onGenerate: (layout: number[][]) => void
}

export function GridConfiguration({ tiles, gridSize, onGridSizeChange, onGenerate }: GridConfigurationProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const totalTiles = tiles.reduce((sum, tile) => sum + tile.count, 0)
  const requiredTiles = gridSize.rows * gridSize.cols
  const canGenerate = totalTiles >= requiredTiles

  const handleGenerate = async () => {
    if (!canGenerate) return

    setIsGenerating(true)
    try {
      // Run optimization in a setTimeout to allow UI to update
      setTimeout(() => {
        const layout = optimizeQuiltLayout(tiles, gridSize.rows, gridSize.cols)
        onGenerate(layout)
        setIsGenerating(false)
      }, 100)
    } catch (error) {
      console.error("Error generating layout:", error)
      alert("Error generating layout. Please try again.")
      setIsGenerating(false)
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-card-foreground">Configure Grid</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Rows</label>
            <Input
              type="number"
              min="2"
              max="20"
              value={gridSize.rows}
              onChange={(e) => onGridSizeChange({ ...gridSize, rows: Number.parseInt(e.target.value) || 2 })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Columns</label>
            <Input
              type="number"
              min="2"
              max="20"
              value={gridSize.cols}
              onChange={(e) => onGridSizeChange({ ...gridSize, cols: Number.parseInt(e.target.value) || 2 })}
            />
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Grid size:</span>
            <span className="font-medium text-foreground">
              {gridSize.rows} × {gridSize.cols} = {requiredTiles} tiles
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available tiles:</span>
            <span className={`font-medium ${canGenerate ? "text-accent" : "text-destructive"}`}>
              {totalTiles} tiles
            </span>
          </div>
          {!canGenerate && (
            <p className="text-sm text-destructive">
              You need {requiredTiles - totalTiles} more tile(s) to fill this grid.
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-sm">
          <h3 className="font-medium text-foreground">Optimization Rules:</h3>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Similar colors spread apart</li>
            <li>• Balanced brightness distribution</li>
            <li>• Maximum spacing for similar patterns</li>
            <li>• Identical tiles never touch</li>
            <li>• Similar pattern types separated</li>
          </ul>
        </div>

        <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="w-full" size="lg">
          {isGenerating ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Optimizing Layout...
            </>
          ) : (
            <>
              <Shuffle className="mr-2 h-4 w-4" />
              Generate Optimal Layout
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
