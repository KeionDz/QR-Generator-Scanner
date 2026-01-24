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
import { Wifi, Camera, Copy, AlertCircle, Wifi as Wifi2, Play, X, Link2 } from "lucide-react"
import { Header } from "../../components/header"
import { Footer } from "../../components/footer"
import Hls from "hls.js"

interface WifiDetails {
  ssid?: string
  password?: string
  security?: string
  hidden?: string
}

interface ProductDetails {
  type: "product"
  gtin?: string
  product?: string
  serial?: string
  batch?: string
  expiry?: string
  info?: string
}

type ScannedData = WifiDetails | ProductDetails | null
type ScannerMode = "device" | "network"
type QRType = "wifi" | "product" | "unknown"

const parseWifiString = (qrData: string): WifiDetails => {
  const details: WifiDetails = {}
  const ssidMatch = qrData.match(/S:([^;]+)/)
  const passwordMatch = qrData.match(/P:([^;]+)/)
  const securityMatch = qrData.match(/T:([^;]+)/)
  const hiddenMatch = qrData.match(/H:([^;]+)/)

  if (ssidMatch) details.ssid = decodeURIComponent(ssidMatch[1].replace(/\\\\/g, "\\"))
  if (passwordMatch) details.password = decodeURIComponent(passwordMatch[1].replace(/\\\\/g, "\\"))
  if (securityMatch) details.security = securityMatch[1]
  if (hiddenMatch) details.hidden = hiddenMatch[1] === "true" ? "Yes" : "No"

  return details
}

const parseProductString = (qrData: string): ProductDetails => {
  const details: ProductDetails = { type: "product" }

  try {
    const url = new URL(qrData)
    details.gtin = url.searchParams.get("gtin") || undefined
    details.product = url.searchParams.get("product") || undefined
    details.serial = url.searchParams.get("serial") || undefined
    details.batch = url.searchParams.get("batch") || undefined
    details.expiry = url.searchParams.get("expiry") || undefined
    details.info = url.searchParams.get("info") || undefined
  } catch {
    const gtinMatch = qrData.match(/[?&]?gtin=([^&]+)/)
    const productMatch = qrData.match(/[?&]?product=([^&]+)/)
    const serialMatch = qrData.match(/[?&]?serial=([^&]+)/)
    const batchMatch = qrData.match(/[?&]?batch=([^&]+)/)
    const expiryMatch = qrData.match(/[?&]?expiry=([^&]+)/)
    const infoMatch = qrData.match(/[?&]?info=([^&]+)/)

    if (gtinMatch) details.gtin = decodeURIComponent(gtinMatch[1])
    if (productMatch) details.product = decodeURIComponent(productMatch[1])
    if (serialMatch) details.serial = decodeURIComponent(serialMatch[1])
    if (batchMatch) details.batch = decodeURIComponent(batchMatch[1])
    if (expiryMatch) details.expiry = decodeURIComponent(expiryMatch[1])
    if (infoMatch) details.info = decodeURIComponent(infoMatch[1])
  }

  return details
}

const copyToClipboard = async (text: string, toast: any) => {
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

const isUrl = (text: string) => {
  try {
    new URL(text)
    return true
  } catch {
    return false
  }
}

const parseQRCode = (qrData: string): { type: QRType; data: ScannedData } => {
  if (qrData.startsWith("WIFI:")) return { type: "wifi", data: parseWifiString(qrData) }
  if (qrData.includes("?gtin=") || qrData.includes("?product=")) return { type: "product", data: parseProductString(qrData) }
  if (qrData.includes("batch=") || qrData.includes("serial=") || qrData.includes("expiry=")) return { type: "product", data: parseProductString(qrData) }
  return { type: "unknown", data: { ssid: qrData } as WifiDetails }
}

export default function QRScanner() {
  const deviceVideoRef = useRef<HTMLVideoElement>(null)
  const networkVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedData>(null)
  const [qrType, setQRType] = useState<QRType>("unknown")
  const [error, setError] = useState<string | null>(null)
  const [scannerMode, setScannerMode] = useState<ScannerMode>("device")
  const [networkCameraUrl, setNetworkCameraUrl] = useState("")
  const [isNetworkCameraConnected, setIsNetworkCameraConnected] = useState(false)
  const [cameraPreviewUrl, setCameraPreviewUrl] = useState("")
  const { toast } = useToast()
  const [urlError, setUrlError] = useState<string | null>(null)

  const connectNetworkCamera = async () => {
    const url = networkCameraUrl.trim()
    if (!url) {
      setUrlError("Stream URL is required")
      return
    }

    setUrlError(null)
    setCameraPreviewUrl(url)
    setIsNetworkCameraConnected(true)
    setIsScanning(true)
  }

  // Device camera stream
  useEffect(() => {
    if (!isScanning || scannerMode !== "device") return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        if (deviceVideoRef.current) {
          deviceVideoRef.current.srcObject = stream
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
      if (deviceVideoRef.current && deviceVideoRef.current.srcObject) {
        const tracks = (deviceVideoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isScanning, scannerMode, toast])

  // QR scanning
  useEffect(() => {
    if (!isScanning) return
    if (!canvasRef.current) return

    const video = scannerMode === "device"
      ? deviceVideoRef.current
      : networkVideoRef.current

    if (!video) return

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

          if (code) {
            const parsedData = parseQRCode(code.data)
            setScannedData(parsedData.data)
            setQRType(parsedData.type)
            setIsScanning(false)

            if (scannerMode === "device" && deviceVideoRef.current?.srcObject) {
              const tracks = (deviceVideoRef.current.srcObject as MediaStream).getTracks()
              tracks.forEach((track) => track.stop())
            }

            toast({
              title: `${parsedData.type === "wifi" ? "Wi-Fi" : parsedData.type === "product" ? "Product" : "QR Code"} QR Code Scanned`,
              description: `Information extracted successfully`,
            })
          }
        } catch {
          // ignore errors
        }
      }

      animationId = requestAnimationFrame(scan)
    }

    animationId = requestAnimationFrame(scan)

    return () => cancelAnimationFrame(animationId)
  }, [isScanning, scannerMode, toast])

  // Network camera HLS stream
  useEffect(() => {
    if (!isNetworkCameraConnected) return
    if (scannerMode !== "network") return

    const url = cameraPreviewUrl || networkCameraUrl.trim()
    const video = networkVideoRef.current
    if (!video) return

    let hls: Hls | null = null

    if (Hls.isSupported()) {
      hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        video.muted = true
        await video.play()
      })
    } else {
      video.src = url
      video.muted = true
      video.play()
    }

    return () => {
      if (hls) hls.destroy()
      if (video) video.src = ""
    }
  }, [isNetworkCameraConnected, scannerMode, cameraPreviewUrl, networkCameraUrl])

  const resetScanner = () => {
    window.location.reload() // ✅ REFRESH PAGE
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
                <CardDescription>Point your camera at a Wi-Fi or Product QR code to extract the information</CardDescription>
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

                    {/* NETWORK MODE */}
                    {scannerMode === "network" && (
                      <div className="space-y-4">
                        <Label htmlFor="camera-url">Network Camera Stream URL</Label>
                        <Input
                          id="camera-url"
                          placeholder="e.g., http:/ip/index.m3u8"
                          value={networkCameraUrl}
                          onChange={(e) => {
                            setNetworkCameraUrl(e.target.value)
                            setUrlError(null)
                          }}
                        />

                        {urlError && (
                          <p className="text-sm text-destructive mt-1">
                            {urlError}
                          </p>
                        )}

                        <Button
                          onClick={connectNetworkCamera}
                          size="lg"
                          className="w-full"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Connect & Auto Scan
                        </Button>
                      </div>
                    )}

                    {/* DEVICE MODE */}
                    {scannerMode === "device" && (
                      <Button
                        onClick={() => setIsScanning(true)}
                        size="lg"
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Scanning
                      </Button>
                    )}
                  </>
                )}

                {/* SCANNING PREVIEW */}
                {isScanning && (
                  <div className="space-y-4">
                    {scannerMode === "network" && (
                      <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                        <video
                          ref={networkVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-80 object-cover"
                        />
                        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
{/* Bigger scan box */}
<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-2 border-primary rounded-lg opacity-50" />
</div>
                      </div>
                    )}

                    {scannerMode === "device" && (
                      <div className="relative w-full bg-muted rounded-lg overflow-hidden">
                        <video
                          ref={deviceVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary rounded-lg opacity-50" />
                        </div>
                      </div>
                    )}

                    <canvas ref={canvasRef} className="hidden" />

                    <Button
                      onClick={() => {
                        setIsScanning(false)
                        if (scannerMode === "device" && deviceVideoRef.current?.srcObject) {
                          const tracks = (deviceVideoRef.current.srcObject as MediaStream).getTracks()
                          tracks.forEach((track) => track.stop())
                        }
                      }}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* RESULT */}
                {scannedData && (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ✓ {qrType === "wifi" ? "Wi-Fi" : qrType === "product" ? "Product" : "QR Code"} scanned successfully
                      </p>
                    </div>

                    {/* URL PREVIEW */}
                    {scannedData &&
                      "ssid" in scannedData &&
                      scannedData.ssid &&
                      isUrl(scannedData.ssid) && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            <p className="font-medium">Link Preview</p>
                          </div>
                          <a
                            href={scannedData.ssid}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {scannedData.ssid}
                          </a>
                        </div>
                      )}

                    {/* WiFi Display */}
                    {qrType === "wifi" && scannedData && "ssid" in scannedData && (
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
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(scannedData.ssid || "", toast)}>
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
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(scannedData.password || "", toast)}>
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
                    )}

                    {/* Product Display */}
                    {qrType === "product" && scannedData && "type" in scannedData && (
                      <div className="space-y-4">
                        {scannedData.product && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Product Name</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={scannedData.product}
                                readOnly
                                className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                              />
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(scannedData.product || "", toast)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {scannedData.gtin && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">GTIN / UPC</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={scannedData.gtin}
                                readOnly
                                className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                              />
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(scannedData.gtin || "", toast)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {scannedData.serial && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Serial Number</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={scannedData.serial}
                                  readOnly
                                  className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm text-xs"
                                />
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(scannedData.serial || "", toast)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {scannedData.batch && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Batch / Lot</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={scannedData.batch}
                                  readOnly
                                  className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm text-xs"
                                />
                                <Button variant="outline" size="sm" onClick={() => copyToClipboard(scannedData.batch || "", toast)}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {scannedData.expiry && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Expiry Date</label>
                            <Badge variant="outline" className="w-fit">
                              {scannedData.expiry}
                            </Badge>
                          </div>
                        )}

                        {scannedData.info && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                              value={scannedData.info}
                              readOnly
                              className="w-full px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={resetScanner}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
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