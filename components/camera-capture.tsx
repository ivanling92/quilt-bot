"use client"

import type React from "react"

import { useRef, useState } from "react"
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const startCamera = async () => {
    console.log("[v0] Starting camera...")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      console.log("[v0] Got media stream:", stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          console.log("[v0] Video metadata loaded, playing video")
          videoRef.current?.play()
          setIsStreaming(true)
        }
      }
    } catch (error) {
      console.error("[v0] Error accessing camera:", error)
      alert("Could not access camera. Please use the file upload instead.")
    }
  }

  const stopCamera = () => {
    console.log("[v0] Stopping camera...")
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsStreaming(false)
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current) return

    console.log("[v0] Capturing photo...")
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = canvas.toDataURL("image/jpeg")

    await processImage(imageData)
    stopCamera()
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
            <Button onClick={startCamera} className="flex-1">
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

      {isStreaming && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">Camera Preview</h3>
              <Button onClick={stopCamera} variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
            </div>

            <div className="flex gap-4">
              <Button onClick={capturePhoto} className="flex-1" size="lg" disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Capture Photo"}
              </Button>
              <Button onClick={stopCamera} variant="outline" size="lg" className="bg-white">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
