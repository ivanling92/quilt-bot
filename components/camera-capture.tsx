"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { analyzeTileImage } from "@/lib/image-analysis"
import type { TileData } from "@/lib/types"

interface CameraCaptureProps {
  onCapture: (tile: TileData) => void
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [debugMessage, setDebugMessage] = useState<string>("")

  useEffect(() => {
    if (isCameraOpen) {
      initCamera()
    }
    return () => {
      if (isCameraOpen) {
        cleanupCamera()
      }
    }
  }, [isCameraOpen])

  useEffect(() => {
    if (!isVideoReady || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawFrame = () => {
      if (!video || video.paused || video.ended) return

      // Set canvas to match the video display size
      const size = Math.min(video.videoWidth, video.videoHeight)
      canvas.width = size
      canvas.height = size

      // Calculate crop area (center square)
      const offsetX = (video.videoWidth - size) / 2
      const offsetY = (video.videoHeight - size) / 2

      // Draw the cropped square portion
      ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size)

      requestAnimationFrame(drawFrame)
    }

    drawFrame()
  }, [isVideoReady])

  const initCamera = async () => {
    setDebugMessage("Requesting camera access...")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      })

      setDebugMessage(`Got stream with ${stream.getVideoTracks().length} video tracks`)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setDebugMessage("Stream attached, waiting for metadata...")

        videoRef.current.onloadedmetadata = () => {
          setDebugMessage("Metadata loaded, playing...")

          videoRef.current
            ?.play()
            .then(() => {
              setDebugMessage("Video playing!")
              setIsVideoReady(true)
            })
            .catch((err) => {
              setDebugMessage(`Play failed: ${err.message}`)
            })
        }

        videoRef.current.onerror = (e) => {
          setDebugMessage(`Video error: ${JSON.stringify(e)}`)
        }
      } else {
        setDebugMessage("ERROR: videoRef.current is null!")
      }
    } catch (error) {
      const err = error as Error
      setDebugMessage(`Camera error: ${err.message}`)
      alert(`Could not access camera: ${err.message}. Please use the file upload instead.`)
      setIsCameraOpen(false)
    }
  }

  const cleanupCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsVideoReady(false)
    setDebugMessage("")
  }

  const openCamera = () => {
    setIsCameraOpen(true)
  }

  const closeCamera = () => {
    cleanupCamera()
    setIsCameraOpen(false)
  }

  const capturePhoto = async () => {
    if (!videoRef.current) return

    setDebugMessage("Capturing...")

    const video = videoRef.current
    const size = Math.min(video.videoWidth, video.videoHeight)
    const offsetX = (video.videoWidth - size) / 2
    const offsetY = (video.videoHeight - size) / 2

    // Create a square canvas for the captured image
    const captureCanvas = document.createElement("canvas")
    captureCanvas.width = size
    captureCanvas.height = size
    const ctx = captureCanvas.getContext("2d")
    if (!ctx) return

    // Draw the center square crop
    ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, size, size)
    const imageData = captureCanvas.toDataURL("image/jpeg")

    await processImage(imageData)
    closeCamera()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      await new Promise<void>((resolve) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          const imageData = e.target?.result as string
          await processImage(imageData)
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }

    setIsProcessing(false)
    // Reset input so same files can be selected again
    event.target.value = ""
  }

  const processImage = async (imageData: string) => {
    try {
      const analysis = await analyzeTileImage(imageData)
      onCapture({
        id: "",
        imageData,
        count: 1,
        ...analysis,
      })
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Error processing image. Please try again.")
    }
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">Capture Tile Patterns</h2>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={openCamera} className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Use Camera
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {isProcessing && (
            <div className="text-center text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
              <p>Analyzing images...</p>
            </div>
          )}
        </div>
      </Card>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex justify-between items-center p-4 bg-black/50">
            <h3 className="text-xl font-semibold text-white">Camera Preview</h3>
            <Button onClick={closeCamera} variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 relative flex items-center justify-center bg-gray-900 p-4">
            {/* Debug message */}
            <div className="absolute top-2 left-2 right-2 bg-black/70 text-white text-xs p-2 rounded z-10">
              {debugMessage || "Initializing..."}
            </div>

            {/* Hidden video element for stream source */}
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />

            {/* Square canvas showing cropped preview */}
            {isVideoReady ? (
              <canvas
                ref={canvasRef}
                className="w-full max-w-[80vmin] aspect-square rounded-lg border-4 border-white/50"
              />
            ) : (
              <div className="w-full max-w-[80vmin] aspect-square rounded-lg border-4 border-white/30 flex items-center justify-center bg-gray-800">
                <div className="text-white text-center p-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
                  <p className="text-lg">Starting camera...</p>
                  <p className="text-sm text-gray-400 mt-2">Please allow camera access</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-black/50 flex gap-4">
            <Button
              onClick={capturePhoto}
              className="flex-1 h-14 text-lg"
              size="lg"
              disabled={!isVideoReady || isProcessing}
            >
              <Camera className="mr-2 h-6 w-6" />
              {isProcessing ? "Processing..." : "Capture"}
            </Button>
            <Button onClick={closeCamera} variant="outline" size="lg" className="bg-white h-14">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
