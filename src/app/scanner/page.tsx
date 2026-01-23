"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useToast } from "../../hooks/use-toast"
import { Toaster } from "../../components/ui/toaster"
import { ThemeProvider } from "../../components/theme-provider"
import { Wifi, Camera, Copy, AlertCircle } from "lucide-react"
import { Header } from "../../components/header"
import { Footer } from "../../components/footer"

interface WifiDetails {
  ssid?: string
  password?: string
  security?: string
  hidden?: string
}

export default function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<WifiDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
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
                    <Button onClick={() => setIsScanning(true)} size="lg" className="w-full">
                      <Camera className="h-4 w-4 mr-2" />
                      Start Scanning
                    </Button>
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
