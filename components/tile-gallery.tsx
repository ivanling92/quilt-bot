"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { TileData } from "@/lib/types"

interface TileGalleryProps {
  tiles: TileData[]
  onUpdate: (id: string, updates: Partial<TileData>) => void
  onRemove: (id: string) => void
}

export function TileGallery({ tiles, onUpdate, onRemove }: TileGalleryProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-card-foreground">Tile Collection ({tiles.length} patterns)</h2>

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
                type="number"
                value={tile.count}
                onChange={(e) => onUpdate(tile.id, { count: Number.parseInt(e.target.value) || 0 })}
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
