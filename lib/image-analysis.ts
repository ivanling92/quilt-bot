import type { TileData } from "./types"

export async function analyzeTileImage(imageData: string): Promise<Omit<TileData, "id" | "imageData" | "count">> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const size = 200
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, size, size)
        const imageData = ctx.getImageData(0, 0, size, size)
        const pixels = imageData.data

        // Calculate dominant color and brightness
        let r = 0,
          g = 0,
          b = 0,
          brightness = 0
        const colorBuckets: { [key: string]: number } = {}

        for (let i = 0; i < pixels.length; i += 4) {
          const red = pixels[i]
          const green = pixels[i + 1]
          const blue = pixels[i + 2]

          r += red
          g += green
          b += blue
          brightness += (red + green + blue) / 3

          // Color bucketing for histogram
          const colorKey = `${Math.floor(red / 32)},${Math.floor(green / 32)},${Math.floor(blue / 32)}`
          colorBuckets[colorKey] = (colorBuckets[colorKey] || 0) + 1
        }

        const pixelCount = pixels.length / 4
        r = Math.round(r / pixelCount)
        g = Math.round(g / pixelCount)
        b = Math.round(b / pixelCount)
        brightness = Math.round(brightness / pixelCount)

        const dominantColor = `rgb(${r}, ${g}, ${b})`

        // Create color histogram (simplified)
        const colorHistogram = Object.values(colorBuckets).slice(0, 64)

        // Detect pattern type using edge detection and variance
        const patternType = detectPatternType(pixels, size)

        // Extract edge colors for better matching
        const edges = extractEdgeColors(pixels, size)

        resolve({
          dominantColor,
          brightness,
          colorHistogram,
          patternType,
          edges,
        })
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = imageData
  })
}

function detectPatternType(pixels: Uint8ClampedArray, size: number): TileData["patternType"] {
  // Simple pattern detection based on variance and edge detection
  let horizontalVariance = 0
  let verticalVariance = 0
  let totalVariance = 0

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const i = (y * size + x) * 4
      const iRight = (y * size + (x + 1)) * 4
      const iDown = ((y + 1) * size + x) * 4

      const current = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
      const right = (pixels[iRight] + pixels[iRight + 1] + pixels[iRight + 2]) / 3
      const down = (pixels[iDown] + pixels[iDown + 1] + pixels[iDown + 2]) / 3

      horizontalVariance += Math.abs(current - right)
      verticalVariance += Math.abs(current - down)
      totalVariance += Math.abs(current - right) + Math.abs(current - down)
    }
  }

  const avgVariance = totalVariance / (size * size * 2)

  // Pattern classification heuristics
  if (avgVariance < 10) {
    return "solid"
  } else if (Math.abs(horizontalVariance - verticalVariance) > totalVariance * 0.3) {
    return "striped"
  } else if (avgVariance > 40) {
    return "floral"
  } else if (avgVariance > 25) {
    return "geometric"
  } else {
    return "abstract"
  }
}

function extractEdgeColors(pixels: Uint8ClampedArray, size: number) {
  const extractLine = (startX: number, startY: number, dx: number, dy: number, length: number) => {
    const colors: number[] = []
    for (let i = 0; i < length; i++) {
      const x = startX + dx * i
      const y = startY + dy * i
      const index = (y * size + x) * 4
      colors.push(pixels[index], pixels[index + 1], pixels[index + 2])
    }
    return colors
  }

  return {
    top: extractLine(0, 0, 1, 0, size),
    right: extractLine(size - 1, 0, 0, 1, size),
    bottom: extractLine(0, size - 1, 1, 0, size),
    left: extractLine(0, 0, 0, 1, size),
  }
}
