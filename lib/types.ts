export interface TileData {
  id: string
  imageData: string
  count: number
  dominantColor: string
  blurredDominantColor: string
  brightness: number
  colorHistogram: number[]
  patternType: "solid" | "striped" | "geometric" | "floral" | "abstract"
  edges: {
    top: number[]
    right: number[]
    bottom: number[]
    left: number[]
  }
}

export interface OptimizationConfig {
  colorWeight: number
  brightnessWeight: number
  patternWeight: number
  spacingWeight: number
  maxIterations: number
  temperature: number
  coolingRate: number
}
