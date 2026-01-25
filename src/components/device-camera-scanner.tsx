"use client"

import React from "react"

import { useRef, useEffect } from "react"
import { Button } from "../components/ui/button"
import { AlertCircle, Camera } from "lucide-react"
import { useToast } from "../hooks/use-toast"

interface DeviceCameraScannerProps {
  isScanning: boolean
  setIsScanning: (value: boolean) => void
  onQRDetected: (qrText: string) => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export function DeviceCameraScanner({
  isScanning,
  setIsScanning,
  onQRDetected,
  canvasRef,
}: DeviceCameraScannerProps) {
  const deviceVideoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()

  const stopCamera = () => {
    if (deviceVideoRef.current && deviceVideoRef.current.srcObject) {
      const tracks = (deviceVideoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      deviceVideoRef.current.srcObject = null
    }
  }

  // Device camera stream
  useEffect(() => {
    if (!isScanning) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        if (deviceVideoRef.current) {
          deviceVideoRef.current.srcObject = stream
        }
      } catch {
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
          variant: "destructive",
        })
        setIsScanning(false)
      }
    }

    startCamera()

    return () => {
      stopCamera()
    }
  }, [isScanning, toast, setIsScanning])

  // QR scanning for device camera
  useEffect(() => {
    if (!isScanning || !canvasRef.current || !deviceVideoRef.current) return

    const video = deviceVideoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    let animationId: number

    const scan = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          const jsQR = (await import("jsqr")).default
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code?.data) {
            const qrText = code.data.trim()
            if (qrText) {
              onQRDetected(qrText)
              stopCamera()
              setIsScanning(false)
            }
          }
        } catch {
          // Continue scanning
        }
      }

      animationId = requestAnimationFrame(scan)
    }

    animationId = requestAnimationFrame(scan)

    return () => cancelAnimationFrame(animationId)
  }, [isScanning, canvasRef, onQRDetected, setIsScanning])

  if (!isScanning) {
    return (
      <Button onClick={() => setIsScanning(true)} size="lg" className="w-full">
        <Camera className="h-4 w-4 mr-2" />
        Start Scanning
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full bg-muted rounded-lg overflow-hidden">
        <video
          ref={deviceVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-80 object-cover"
        />
        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-primary rounded-lg opacity-50" />
        </div>
      </div>
      <Button onClick={() => setIsScanning(false)} variant="outline" className="w-full bg-transparent">
        Stop Scanning
      </Button>
    </div>
  )
}
