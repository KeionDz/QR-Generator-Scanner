"use client"

import { Input } from "../../components/ui/input"

import { Label } from "../../components/ui/label"

import { useState, useRef, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useToast } from "../../hooks/use-toast"
import { Toaster } from "../../components/ui/toaster"
import { ThemeProvider } from "../../components/theme-provider"
import { Wifi, Camera, Copy, AlertCircle, Wifi as Wifi2 } from "lucide-react"
import { Header } from "../../components/header"
import { Footer } from "../../components/footer"

interface WifiDetails {
  ssid?: string
  password?: string
  security?: string
  hidden?: string
}

type ScannerMode = "device" | "network"

export default function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<WifiDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scannerMode, setScannerMode] = useState<ScannerMode>("device")
  const [networkCameraUrl, setNetworkCameraUrl] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (!isScanning) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setError(null)
      } catch (err) {
        setError("Camera access denied. Please enable camera permissions.")
        setIsScanning(false)
        toast({
          title: "Camera Error",
          description: "Unable to access camera. Please check permissions.",
          variant: "destructive",
        })
      }
    }

    startCamera()

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isScanning, toast])

  useEffect(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const video = videoRef.current
    let animationId: number

    const scan = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        try {
          // Dynamically import jsQR
          const jsQR = (await import("jsqr")).default

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code) {
            const data = code.data
            const wifiData = parseWifiString(data)
            setScannedData(wifiData)
            setIsScanning(false)

            // Stop camera
            if (videoRef.current && videoRef.current.srcObject) {
              const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
              tracks.forEach((track) => track.stop())
            }

            toast({
              title: "QR Code Scanned",
              description: "Wi-Fi information extracted successfully",
            })
          }
        } catch (err) {
          console.log("[v0] Scanning in progress...")
        }
      }

      animationId = requestAnimationFrame(scan)
    }

    animationId = requestAnimationFrame(scan)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isScanning, toast])

  const parseWifiString = (qrData: string): WifiDetails => {
    const details: WifiDetails = {}

    // Parse WIFI QR code format: WIFI:T:WPA;S:networkname;P:password;H:hidden;;
    const ssidMatch = qrData.match(/S:([^;]+)/)
    const passwordMatch = qrData.match(/P:([^;]+)/)
    const securityMatch = qrData.match(/T:([^;]+)/)
    const hiddenMatch = qrData.match(/H:([^;]+)/)

    if (ssidMatch) details.ssid = ssidMatch[1]
    if (passwordMatch) details.password = passwordMatch[1]
    if (securityMatch) details.security = securityMatch[1]
    if (hiddenMatch) details.hidden = hiddenMatch[1] === "true" ? "Yes" : "No"

    return details
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied to Clipboard",
        description: "Information copied successfully",
      })
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const resetScanner = () => {
    setScannedData(null)
    setError(null)
  }

  const handleNetworkCameraConnect = async () => {
    if (!networkCameraUrl.trim()) {
      setError("Please enter a network camera URL")
      return
    }

    try {
      setError(null)
      // In a real implementation, this would connect to the network camera stream
      toast({
        title: "Network Camera Mode",
        description: "Enter the RTSP or HTTP stream URL from your network camera. (This is a placeholder for demonstration)",
      })
    } catch (err) {
      setError("Could not connect to network camera")
      toast({
        title: "Connection Error",
        description: "Unable to connect to network camera. Please check the URL.",
        variant: "destructive",
      })
    }
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-balance mb-4">QR Code Scanner</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Scan Wi-Fi QR codes to quickly view and extract network information.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Scan QR Code
                </CardTitle>
                <CardDescription>Point your camera at a Wi-Fi QR code to extract the network details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isScanning && !scannedData && (
                  <>
                    {error && (
                      <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    {/* Mode Selection */}
                    <div className="flex gap-2 border-b pb-4">
                      <button
                        onClick={() => setScannerMode("device")}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                          scannerMode === "device"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Device Camera
                        </div>
                      </button>
                      <button
                        onClick={() => setScannerMode("network")}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                          scannerMode === "network"
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Wifi2 className="h-4 w-4" />
                          Network Camera
                        </div>
                      </button>
                    </div>

                    {scannerMode === "device" && (
                      <Button onClick={() => setIsScanning(true)} size="lg" className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Start Scanning
                      </Button>
                    )}

                    {scannerMode === "network" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="camera-url">Network Camera Stream URL</Label>
                          <Input
                            id="camera-url"
                            placeholder="e.g., rtsp://192.168.1.100:554/stream or http://..."
                            value={networkCameraUrl}
                            onChange={(e) => setNetworkCameraUrl(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Supported formats: RTSP, HTTP, or HLS stream URLs
                          </p>
                        </div>
                        <Button onClick={handleNetworkCameraConnect} size="lg" className="w-full">
                          <Wifi2 className="h-4 w-4 mr-2" />
                          Connect Network Camera
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {isScanning && (
                  <>
                    <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary rounded-lg opacity-50" />
                      </div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <Button
                      onClick={() => {
                        setIsScanning(false)
                        if (videoRef.current && videoRef.current.srcObject) {
                          const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
                          tracks.forEach((track) => track.stop())
                        }
                      }}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {scannedData && (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">✓ QR Code scanned successfully</p>
                    </div>

                    <div className="space-y-4">
                      {scannedData.ssid && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Network Name (SSID)</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={scannedData.ssid}
                              readOnly
                              className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(scannedData.ssid || "")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {scannedData.password && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Password</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="password"
                              value={scannedData.password}
                              readOnly
                              className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(scannedData.password || "")}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        {scannedData.security && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Security Type</label>
                            <Badge variant="secondary" className="w-fit">
                              {scannedData.security === "nopass" ? "Open" : scannedData.security}
                            </Badge>
                          </div>
                        )}

                        {scannedData.hidden && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Hidden Network</label>
                            <Badge variant="outline">{scannedData.hidden}</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button onClick={resetScanner} variant="outline" className="w-full bg-transparent">
                      Scan Another QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
