"use client"

import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { TileData } from "@/lib/types"
import { useState } from "react"

interface TileGalleryProps {
  tiles: TileData[]
  onUpdate: (id: string, updates: Partial<TileData>) => void
  onRemove: (id: string) => void
}

export function TileGallery({ tiles, onUpdate, onRemove }: TileGalleryProps) {
  const [baseNumber, setBaseNumber] = useState<string>("")

  const applyBaseNumber = () => {
    const num = Number.parseInt(baseNumber, 10)
    if (!isNaN(num) && num > 0) {
      // Update each tile individually
      for (const tile of tiles) {
        onUpdate(tile.id, { count: tile.count + num })
      }
      setBaseNumber("")
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-card-foreground">Tile Collection ({tiles.length} patterns)</h2>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={baseNumber}
            onChange={(e) => setBaseNumber(e.target.value)}
            placeholder="Base number"
            className="h-9 w-32"
          />
          <Button
            onClick={applyBaseNumber}
            disabled={!baseNumber || Number.parseInt(baseNumber, 10) <= 0}
            size="sm"
            variant="secondary"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add to All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tiles.map((tile) => (
          <div key={tile.id} className="space-y-2">
            <div className="relative group">
              <img
                src={tile.imageData || "/placeholder.svg"}
                alt="Tile"
                className="w-full aspect-square object-cover rounded-lg border-2 border-border"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(tile.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>

              {/* Visual indicators */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                <div
                  className="w-6 h-6 rounded border border-white shadow-sm"
                  style={{ backgroundColor: tile.dominantColor }}
                  title="Dominant color"
                />
                <div
                  className="w-6 h-6 rounded border border-white shadow-sm flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: tile.brightness > 128 ? "#fff" : "#000",
                    color: tile.brightness > 128 ? "#000" : "#fff",
                  }}
                  title={`Brightness: ${tile.brightness}`}
                >
                  {Math.round(tile.brightness / 25.5)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground flex-shrink-0">Qty:</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={tile.count === 0 ? "" : tile.count.toString()}
                onChange={(e) => {
                  const value = e.target.value
                  // Allow empty string or valid numbers
                  if (value === "") {
                    onUpdate(tile.id, { count: 0 })
                  } else {
                    const num = Number.parseInt(value, 10)
                    if (!isNaN(num)) {
                      onUpdate(tile.id, { count: num })
                    }
                  }
                }}
                placeholder="0"
                className="h-8"
              />
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Pattern: {tile.patternType}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
