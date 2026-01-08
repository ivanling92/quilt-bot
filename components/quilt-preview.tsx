"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Download, RefreshCw, ZoomIn, ZoomOut, RotateCcw, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { TileData } from "@/lib/types"

interface QuiltPreviewProps {
  tiles: TileData[]
  layout: number[][]
  gridSize: { rows: number; cols: number }
  onLayoutUpdate?: (newLayout: number[][]) => void
  onRegenerate?: () => void
}

export function QuiltPreview({ tiles, layout, gridSize, onLayoutUpdate, onRegenerate }: QuiltPreviewProps) {
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null)

  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleTileClick = (rowIndex: number, colIndex: number) => {
    if (selectedPosition === null) {
      // First click - select tile
      setSelectedPosition({ row: rowIndex, col: colIndex })
    } else if (selectedPosition.row === rowIndex && selectedPosition.col === colIndex) {
      // Clicked same tile - deselect
      setSelectedPosition(null)
    } else {
      // Second click - swap tiles
      const newLayout = layout.map((row) => [...row])
      const temp = newLayout[selectedPosition.row][selectedPosition.col]
      newLayout[selectedPosition.row][selectedPosition.col] = newLayout[rowIndex][colIndex]
      newLayout[rowIndex][colIndex] = temp

      onLayoutUpdate?.(newLayout)
      setSelectedPosition(null)
    }
  }

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5))
  const handleResetZoom = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = () => setIsDragging(false)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-card-foreground">Optimized Quilt Layout</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            {onRegenerate && (
              <Button variant="outline" size="sm" onClick={onRegenerate}>
                <Shuffle className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="bg-muted rounded-lg p-4 overflow-hidden touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
        >
          <p className="text-sm text-muted-foreground mb-3 text-center">
            {selectedPosition
              ? `Tile selected at (${selectedPosition.row}, ${selectedPosition.col}) - Click another tile to swap`
              : "Click a tile to select, then click another to swap"}
          </p>
          <p className="text-xs text-muted-foreground mb-3 text-center">
            Zoom: {Math.round(scale * 100)}% {scale > 1 && "- Drag to pan"}
          </p>

          <div
            className="transition-transform duration-100"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: "center center",
            }}
          >
            <div
              className="grid gap-1 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))`,
                maxWidth: `${gridSize.cols * 80}px`,
              }}
            >
              {layout.map((row, rowIndex) =>
                row.map((tileIndex, colIndex) => {
                  const tile = tiles[tileIndex]
                  if (!tile) return null

                  const isSelected = selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="relative aspect-square group cursor-pointer"
                      onClick={() => handleTileClick(rowIndex, colIndex)}
                    >
                      <img
                        src={tile.imageData || "/placeholder.svg"}
                        alt={`Tile ${rowIndex}-${colIndex}`}
                        className={`w-full h-full object-cover rounded transition-all ${
                          isSelected
                            ? "ring-4 ring-primary ring-offset-2 scale-95"
                            : "hover:ring-2 hover:ring-primary/50"
                        } ${selectedPosition && !isSelected ? "opacity-70 hover:opacity-100" : ""}`}
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center pointer-events-none">
                        <span className="text-white text-xs">
                          {rowIndex},{colIndex}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium">
                            Selected
                          </span>
                        </div>
                      )}
                    </div>
                  )
                }),
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3 text-card-foreground">Layout Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">
              {gridSize.rows}x{gridSize.cols}
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
