"use client"

import React from "react"

import { useRef, useEffect, useState } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { CctvIcon } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import Hls from "hls.js"

interface NetworkCameraScannerProps {
  isScanning: boolean
  setIsScanning: (value: boolean) => void
  onQRDetected: (qrText: string) => void
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function NetworkCameraScanner({
  isScanning,
  setIsScanning,
  onQRDetected,
  canvasRef,
}: NetworkCameraScannerProps) {
  const networkVideoRef = useRef<HTMLVideoElement>(null)
  const [networkCameraUrl, setNetworkCameraUrl] = useState("")
  const [isNetworkCameraConnected, setIsNetworkCameraConnected] = useState(false)
  const [cameraPreviewUrl, setCameraPreviewUrl] = useState("")
  const [isLoadingStream, setIsLoadingStream] = useState(false)
  const [isValidatingUrl, setIsValidatingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [connectionLost, setConnectionLost] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [retryIntervalId, setRetryIntervalId] = useState<ReturnType<typeof setInterval> | null>(null)
  const { toast } = useToast()

  // Validate stream URL
  const validateStreamUrl = async (url: string) => {
    try {
      const res = await fetch(url, { method: "HEAD" })
      return res.ok
    } catch {
      return false
    }
  }

  const connectNetworkCamera = async () => {
    const url = networkCameraUrl.trim()
    if (!url) {
      setUrlError("Stream URL is required")
      return
    }

    setUrlError(null)
    setConnectionLost(false)
    setRetrying(false)

    setIsValidatingUrl(true)
    const isValid = await validateStreamUrl(url)
    setIsValidatingUrl(false)

    if (!isValid) {
      setUrlError("Stream URL not reachable")
      return
    }

    setCameraPreviewUrl(url)
    setIsNetworkCameraConnected(true)
    setIsScanning(true)
    setIsLoadingStream(true)
  }

  const retryConnection = async () => {
    setRetrying(true)
    setIsLoadingStream(true)
    setConnectionLost(false)

    if (retryIntervalId) {
      clearInterval(retryIntervalId)
      setRetryIntervalId(null)
    }

    const interval = setInterval(async () => {
      const url = networkCameraUrl.trim()
      if (!url) return

      const isValid = await validateStreamUrl(url)

      if (isValid) {
        await connectNetworkCamera()
        clearInterval(interval)
        setRetryIntervalId(null)
        setRetrying(false)
      }
    }, 2000)

    setRetryIntervalId(interval)
  }

  useEffect(() => {
    return () => {
      if (retryIntervalId) clearInterval(retryIntervalId)
    }
  }, [retryIntervalId])

  // Network camera HLS stream
  useEffect(() => {
    if (!isNetworkCameraConnected) return

    const url = cameraPreviewUrl || networkCameraUrl.trim()
    const video = networkVideoRef.current
    if (!video) return

    let hls: Hls | null = null
    let retryTimeout: NodeJS.Timeout | null = null

    const onPlaying = () => {
      setIsLoadingStream(false)
      setConnectionLost(false)
    }

    const onError = () => {
      setIsLoadingStream(true)
      setConnectionLost(true)

      retryTimeout = setTimeout(() => {
        setIsLoadingStream(false)
      }, 1500)
    }

    video.addEventListener("playing", onPlaying)
    video.addEventListener("error", onError)

    if (Hls.isSupported()) {
      hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        video.muted = true
        await video.play()
      })

      hls.on(Hls.Events.ERROR, () => {
        onError()
      })
    } else {
      video.src = url
      video.muted = true
      video.play().catch(() => onError())
    }

    return () => {
      video.removeEventListener("playing", onPlaying)
      video.removeEventListener("error", onError)

      if (retryTimeout) clearTimeout(retryTimeout)
      if (hls) hls.destroy()
      if (video) video.src = ""
    }
  }, [isNetworkCameraConnected, cameraPreviewUrl, networkCameraUrl])

  // QR scanning for network camera
  useEffect(() => {
    if (!isScanning || !canvasRef.current || !networkVideoRef.current) return

    const video = networkVideoRef.current
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
      <div className="space-y-4">
        <Label htmlFor="camera-url">Network Camera Stream URL</Label>
        <p className="text-sm text-muted-foreground text-pretty max-w-2xl mx-auto">
          Note: You must run a network camera that outputs an HLS stream (m3u8). Examples include IP cameras with RTSP to HLS conversion, or software like OBS Studio.
        </p>
        <div className="relative">
          <Input
            id="camera-url"
            placeholder="e.g., http://ip/index.m3u8"
            value={networkCameraUrl}
            onChange={(e) => {
              setNetworkCameraUrl(e.target.value)
              setUrlError(null)
            }}
            className="pr-10"
          />

          {isValidatingUrl && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500" />
            </div>
          )}
        </div>

        {urlError && <p className="text-sm text-destructive mt-1">{urlError}</p>}

        <Button onClick={connectNetworkCamera} size="lg" className="w-full">
          <CctvIcon className="h-4 w-4 mr-2" />
          Connect & Auto Scan
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full bg-muted rounded-lg overflow-hidden">
        <video
          ref={networkVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-80 object-cover"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        />

        {isLoadingStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
          </div>
        )}

        {connectionLost && !isLoadingStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4">
            <p className="font-bold text-lg">Connection Lost</p>
            <p className="text-sm mt-2">Please check your network or camera URL.</p>
            <Button onClick={retryConnection} className="mt-4">
              Retry
            </Button>
          </div>
        )}

        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-primary rounded-lg opacity-50" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary">Zoom</Badge>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm font-medium w-12">{zoom.toFixed(1)}x</span>
      </div>

      <Button onClick={() => setIsScanning(false)} variant="outline" className="w-full bg-transparent">
        Stop Scanning
      </Button>
    </div>
  )
}
