import type { TileData, OptimizationConfig } from "./types"

const DEFAULT_CONFIG: OptimizationConfig = {
  colorWeight: 2.0,
  brightnessWeight: 1.5,
  patternWeight: 2.5,
  spacingWeight: 3.0,
  maxIterations: 5000,
  temperature: 100,
  coolingRate: 0.995,
}

export function optimizeQuiltLayout(
  tiles: TileData[],
  rows: number,
  cols: number,
  config: OptimizationConfig = DEFAULT_CONFIG,
  seed?: number,
): number[][] {
  const random = seed !== undefined ? seededRandom(seed) : Math.random

  // Expand tiles based on their count
  const expandedTileIndices: number[] = []
  tiles.forEach((tile, index) => {
    for (let i = 0; i < tile.count; i++) {
      expandedTileIndices.push(index)
    }
  })

  // Shuffle to create initial random layout
  const shuffled = [...expandedTileIndices]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Create initial layout
  let currentLayout: number[][] = []
  let index = 0
  for (let r = 0; r < rows; r++) {
    currentLayout[r] = []
    for (let c = 0; c < cols; c++) {
      currentLayout[r][c] = shuffled[index++]
    }
  }

  let currentEnergy = calculateEnergy(currentLayout, tiles, config)
  let bestLayout = currentLayout.map((row) => [...row])
  let bestEnergy = currentEnergy

  // Simulated annealing
  let temperature = config.temperature
  for (let iteration = 0; iteration < config.maxIterations; iteration++) {
    // Random swap
    const newLayout = currentLayout.map((row) => [...row])
    const r1 = Math.floor(random() * rows)
    const c1 = Math.floor(random() * cols)
    const r2 = Math.floor(random() * rows)
    const c2 = Math.floor(random() * cols)

    // Swap tiles
    const temp = newLayout[r1][c1]
    newLayout[r1][c1] = newLayout[r2][c2]
    newLayout[r2][c2] = temp

    const newEnergy = calculateEnergy(newLayout, tiles, config)
    const deltaEnergy = newEnergy - currentEnergy

    // Accept or reject based on simulated annealing
    if (deltaEnergy < 0 || random() < Math.exp(-deltaEnergy / temperature)) {
      currentLayout = newLayout
      currentEnergy = newEnergy

      if (currentEnergy < bestEnergy) {
        bestLayout = currentLayout.map((row) => [...row])
        bestEnergy = currentEnergy
      }
    }

    temperature *= config.coolingRate
  }

  return bestLayout
}

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function calculateEnergy(layout: number[][], tiles: TileData[], config: OptimizationConfig): number {
  let energy = 0
  const rows = layout.length
  const cols = layout[0].length

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const currentTileIndex = layout[r][c]
      const currentTile = tiles[currentTileIndex]

      // Check all neighbors
      const neighbors = [
        { dr: -1, dc: 0 }, // top
        { dr: 1, dc: 0 }, // bottom
        { dr: 0, dc: -1 }, // left
        { dr: 0, dc: 1 }, // right
      ]

      for (const { dr, dc } of neighbors) {
        const nr = r + dr
        const nc = c + dc

        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const neighborTileIndex = layout[nr][nc]
          const neighborTile = tiles[neighborTileIndex]

          // Rule 1 & 4: Identical tiles should not touch (highest penalty)
          if (currentTileIndex === neighborTileIndex) {
            energy += 100 * config.spacingWeight
          }

          const colorDifference = calculateColorDifference(
            currentTile.blurredDominantColor,
            neighborTile.blurredDominantColor,
          )
          energy += (1 / (colorDifference + 1)) * config.colorWeight

          // Rule 2: Brightness should vary
          const brightnessDiff = Math.abs(currentTile.brightness - neighborTile.brightness)
          energy += (1 / (brightnessDiff + 1)) * config.brightnessWeight

          // Rule 5: Similar patterns should not touch
          if (currentTile.patternType === neighborTile.patternType) {
            energy += 10 * config.patternWeight
          }
        }
      }

      // Rule 3: Check for regularity (penalize if same tile appears in regular grid pattern)
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (layout[nr][nc] === currentTileIndex) {
              const distance = Math.sqrt(dr * dr + dc * dc)
              energy += (1 / distance) * config.spacingWeight
            }
          }
        }
      }
    }
  }

  // Additional penalty for brightness clustering
  energy += calculateBrightnessClustering(layout, tiles) * config.brightnessWeight

  return energy
}

function calculateColorDifference(color1: string, color2: string): number {
  const rgb1 = parseRGB(color1)
  const rgb2 = parseRGB(color2)

  if (!rgb1 || !rgb2) return 0

  // Euclidean distance in RGB space
  const dr = rgb1.r - rgb2.r
  const dg = rgb1.g - rgb2.g
  const db = rgb1.b - rgb2.b

  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function parseRGB(color: string): { r: number; g: number; b: number } | null {
  const match = color.match(/rgb$$(\d+),\s*(\d+),\s*(\d+)$$/)
  if (!match) return null

  return {
    r: Number.parseInt(match[1]),
    g: Number.parseInt(match[2]),
    b: Number.parseInt(match[3]),
  }
}

function calculateBrightnessClustering(layout: number[][], tiles: TileData[]): number {
  let clustering = 0
  const rows = layout.length
  const cols = layout[0].length

  const windowSize = Math.min(rows, cols) >= 5 ? 3 : 2
  const windowArea = windowSize * windowSize
  const threshold = windowSize === 3 ? 900 : 400 // Scale threshold with window size

  // Check for patches of similar brightness in windowSize x windowSize windows
  for (let r = 0; r <= rows - windowSize; r++) {
    for (let c = 0; c <= cols - windowSize; c++) {
      const brightnesses: number[] = []

      // Collect brightness values from the window
      for (let dr = 0; dr < windowSize; dr++) {
        for (let dc = 0; dc < windowSize; dc++) {
          brightnesses.push(tiles[layout[r + dr][c + dc]].brightness)
        }
      }

      const avg = brightnesses.reduce((a, b) => a + b, 0) / windowArea
      const variance = brightnesses.reduce((sum, b) => sum + Math.pow(b - avg, 2), 0) / windowArea

      // Low variance means similar brightness (bad)
      if (variance < threshold) {
        clustering += (threshold - variance) / 10
      }
    }
  }

  return clustering
}
