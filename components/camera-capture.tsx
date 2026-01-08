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

  const initCamera = async () => {
    setDebugMessage("Requesting camera access...")
    console.log("[v0] Requesting camera access...")

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setDebugMessage(`Got stream with ${stream.getVideoTracks().length} video tracks`)
      console.log("[v0] Got media stream:", stream.getVideoTracks())

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setDebugMessage("Stream attached to video element, waiting for metadata...")
        console.log("[v0] Stream attached to video element")

        videoRef.current.onloadedmetadata = () => {
          setDebugMessage("Metadata loaded, attempting to play...")
          console.log("[v0] Video metadata loaded")

          videoRef.current
            ?.play()
            .then(() => {
              setDebugMessage("Video playing successfully!")
              console.log("[v0] Video playing successfully")
              setIsVideoReady(true)
            })
            .catch((err) => {
              setDebugMessage(`Play failed: ${err.message}`)
              console.error("[v0] Video play failed:", err)
            })
        }

        videoRef.current.onerror = (e) => {
          setDebugMessage(`Video error: ${JSON.stringify(e)}`)
          console.error("[v0] Video element error:", e)
        }
      } else {
        setDebugMessage("ERROR: videoRef.current is null!")
        console.error("[v0] videoRef.current is null")
      }
    } catch (error) {
      const err = error as Error
      setDebugMessage(`Camera error: ${err.message}`)
      console.error("[v0] Error accessing camera:", error)
      alert(`Could not access camera: ${err.message}. Please use the file upload instead.`)
      setIsCameraOpen(false)
    }
  }

  const cleanupCamera = () => {
    console.log("[v0] Cleaning up camera...")
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("[v0] Stopped track:", track.label)
      })
      videoRef.current.srcObject = null
    }
    setIsVideoReady(false)
    setDebugMessage("")
  }

  const openCamera = () => {
    console.log("[v0] Opening camera modal...")
    setIsCameraOpen(true)
  }

  const closeCamera = () => {
    console.log("[v0] Closing camera modal...")
    cleanupCamera()
    setIsCameraOpen(false)
  }

  const capturePhoto = async () => {
    if (!videoRef.current) {
      console.error("[v0] Cannot capture: videoRef is null")
      return
    }

    console.log("[v0] Capturing photo...")
    setDebugMessage("Capturing...")

    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = canvas.toDataURL("image/jpeg")

    await processImage(imageData)
    closeCamera()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const imageData = e.target?.result as string
      await processImage(imageData)
    }
    reader.readAsDataURL(file)
  }

  const processImage = async (imageData: string) => {
    setIsProcessing(true)
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
    } finally {
      setIsProcessing(false)
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
              Upload Image
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </div>

          {isProcessing && (
            <div className="text-center text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2" />
              <p>Analyzing image...</p>
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

          <div className="flex-1 relative flex items-center justify-center bg-gray-900">
            {/* Debug message overlay */}
            <div className="absolute top-4 left-4 right-4 bg-black/70 text-white text-sm p-2 rounded z-10">
              Debug: {debugMessage || "Initializing..."}
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
              style={{ display: isVideoReady ? "block" : "none" }}
            />

            {!isVideoReady && (
              <div className="text-white text-center p-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4" />
                <p className="text-lg">Starting camera...</p>
                <p className="text-sm text-gray-400 mt-2">Please allow camera access if prompted</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-black/50 flex gap-4">
            <Button onClick={capturePhoto} className="flex-1" size="lg" disabled={!isVideoReady || isProcessing}>
              <Camera className="mr-2 h-5 w-5" />
              {isProcessing ? "Processing..." : "Capture Photo"}
            </Button>
            <Button onClick={closeCamera} variant="outline" size="lg" className="bg-white">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
