"use client"

import type React from "react"

import { useState } from "react"
import { Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { TileData } from "@/lib/types"

interface QuiltPreviewProps {
  tiles: TileData[]
  layout: number[][]
  gridSize: { rows: number; cols: number }
  onLayoutUpdate?: (newLayout: number[][]) => void
}

export function QuiltPreview({ tiles, layout, gridSize, onLayoutUpdate }: QuiltPreviewProps) {
  const [draggedPosition, setDraggedPosition] = useState<{ row: number; col: number } | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ row: number; col: number } | null>(null)

  const handleDownload = () => {
    const canvas = document.createElement("canvas")
    const tileSize = 200
    canvas.width = gridSize.cols * tileSize
    canvas.height = gridSize.rows * tileSize
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let loadedImages = 0
    const totalImages = gridSize.rows * gridSize.cols

    layout.forEach((row, rowIndex) => {
      row.forEach((tileIndex, colIndex) => {
        const tile = tiles[tileIndex]
        if (!tile) return

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          ctx.drawImage(img, colIndex * tileSize, rowIndex * tileSize, tileSize, tileSize)
          loadedImages++

          if (loadedImages === totalImages) {
            const link = document.createElement("a")
            link.download = `quilt-${Date.now()}.png`
            link.href = canvas.toDataURL("image/png")
            link.click()
          }
        }
        img.src = tile.imageData
      })
    })
  }

  const handleDragStart = (rowIndex: number, colIndex: number) => {
    setDraggedPosition({ row: rowIndex, col: colIndex })
  }

  const handleDragOver = (e: React.DragEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault()
    setHoverPosition({ row: rowIndex, col: colIndex })
  }

  const handleDrop = (rowIndex: number, colIndex: number) => {
    if (!draggedPosition) return

    if (draggedPosition.row === rowIndex && draggedPosition.col === colIndex) {
      setDraggedPosition(null)
      setHoverPosition(null)
      return
    }

    // Create a new layout with swapped tiles
    const newLayout = layout.map((row) => [...row])
    const temp = newLayout[draggedPosition.row][draggedPosition.col]
    newLayout[draggedPosition.row][draggedPosition.col] = newLayout[rowIndex][colIndex]
    newLayout[rowIndex][colIndex] = temp

    onLayoutUpdate?.(newLayout)
    setDraggedPosition(null)
    setHoverPosition(null)
  }

  const handleTouchStart = (e: React.TouchEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault()
    setDraggedPosition({ row: rowIndex, col: colIndex })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedPosition) return
    e.preventDefault()

    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    const tileElement = element?.closest("[data-tile-position]")

    if (tileElement) {
      const position = tileElement.getAttribute("data-tile-position")
      if (position) {
        const [row, col] = position.split("-").map(Number)
        setHoverPosition({ row, col })
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedPosition || !hoverPosition) {
      setDraggedPosition(null)
      setHoverPosition(null)
      return
    }

    handleDrop(hoverPosition.row, hoverPosition.col)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">Optimized Quilt Layout</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-4 overflow-auto">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Touch and hold or drag tiles to swap positions
          </p>

          <div
            className="grid gap-1 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
              maxWidth: `${gridSize.cols * 120}px`,
            }}
          >
            {layout.map((row, rowIndex) =>
              row.map((tileIndex, colIndex) => {
                const tile = tiles[tileIndex]
                if (!tile) return null

                const isDragging = draggedPosition?.row === rowIndex && draggedPosition?.col === colIndex
                const isHovering = hoverPosition?.row === rowIndex && hoverPosition?.col === colIndex

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    data-tile-position={`${rowIndex}-${colIndex}`}
                    className="relative aspect-square group"
                    draggable
                    onDragStart={() => handleDragStart(rowIndex, colIndex)}
                    onDragOver={(e) => handleDragOver(e, rowIndex, colIndex)}
                    onDrop={() => handleDrop(rowIndex, colIndex)}
                    onTouchStart={(e) => handleTouchStart(e, rowIndex, colIndex)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img
                      src={tile.imageData || "/placeholder.svg"}
                      alt={`Tile ${rowIndex}-${colIndex}`}
                      className={`w-full h-full object-cover rounded transition-all ${
                        isDragging ? "opacity-40 scale-95 cursor-grabbing" : "cursor-grab"
                      } ${isHovering && draggedPosition ? "ring-4 ring-primary shadow-lg" : ""}`}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center pointer-events-none">
                      <span className="text-white text-xs">
                        {rowIndex},{colIndex}
                      </span>
                    </div>
                  </div>
                )
              }),
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Layout Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">
              {gridSize.rows}×{gridSize.cols}
            </div>
            <div className="text-xs text-muted-foreground">Grid Size</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-accent">{tiles.length}</div>
            <div className="text-xs text-muted-foreground">Unique Patterns</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">{layout.flat().length}</div>
            <div className="text-xs text-muted-foreground">Total Tiles</div>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-accent">✓</div>
            <div className="text-xs text-muted-foreground">Optimized</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
