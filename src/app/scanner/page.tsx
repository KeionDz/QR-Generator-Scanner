"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { useToast } from "../../hooks/use-toast"
import { Toaster } from "../../components/ui/toaster"
import { ThemeProvider } from "../../components/theme-provider"
import { Wifi, Camera, Copy, AlertCircle } from "lucide-react"
import { Header } from "../../components/header"
import { Footer } from "../../components/footer"
import { DeviceCameraScanner } from "../../components/device-camera-scanner"
import { NetworkCameraScanner } from "../../components/network-camera-scanner"

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

const parseQRCode = (qrData: string): { type: QRType; data: ScannedData } => {
  if (qrData.startsWith("WIFI:")) return { type: "wifi", data: parseWifiString(qrData) }
  if (qrData.includes("?gtin=") || qrData.includes("?product=")) return { type: "product", data: parseProductString(qrData) }
  if (qrData.includes("batch=") || qrData.includes("serial=") || qrData.includes("expiry=")) return { type: "product", data: parseProductString(qrData) }
  return { type: "unknown", data: { ssid: qrData } as WifiDetails }
}

const isValidScannedData = (type: QRType, data: ScannedData) => {
  if (!data) return false
  if (type === "wifi") return !!(data as WifiDetails).ssid
  if (type === "product") {
    const p = data as ProductDetails
    return !!(p.gtin || p.product || p.serial || p.batch || p.expiry || p.info)
  }
  return !!((data as WifiDetails).ssid?.trim())
}

export default function QRScanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedData>(null)
  const [qrType, setQRType] = useState<QRType>("unknown")
  const [scannerMode, setScannerMode] = useState<ScannerMode>("device")
  const { toast } = useToast()

  const handleQRDetected = (qrText: string) => {
    if (!qrText.trim()) {
      toast({
        title: "Invalid QR Code",
        description: "QR scanned but contains no data.",
        variant: "destructive",
      })
      return
    }

    const parsedData = parseQRCode(qrText)

    if (!isValidScannedData(parsedData.type, parsedData.data)) {
      toast({
        title: "Invalid QR Code",
        description: "QR scanned but no valid data found.",
        variant: "destructive",
      })
      return
    }

    setScannedData(parsedData.data)
    setQRType(parsedData.type)

    toast({
      title: `${parsedData.type === "wifi" ? "Wi-Fi" : parsedData.type === "product" ? "Product" : "QR Code"} QR Code Scanned`,
      description: "Information extracted successfully",
    })
  }

  const resetScanner = () => {
    setIsScanning(false)
    setScannedData(null)
    setQRType("unknown")
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

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-balance mb-4">QR Code Scanner</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Scan QR codes to quickly view and extract network or product information.
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
                          <Wifi className="h-4 w-4" />
                          Network Camera
                        </div>
                      </button>
                    </div>

                    {/* Device Camera Scanner */}
                    {scannerMode === "device" && (
                      <DeviceCameraScanner
                        isScanning={isScanning}
                        setIsScanning={setIsScanning}
                        onQRDetected={handleQRDetected}
                        canvasRef={canvasRef}
                      />
                    )}

                    {/* Network Camera Scanner */}
                    {scannerMode === "network" && (
                      <NetworkCameraScanner
                        isScanning={isScanning}
                        setIsScanning={setIsScanning}
                        onQRDetected={handleQRDetected}
                        canvasRef={canvasRef}
                      />
                    )}
                  </>
                )}

                {/* Scanning Preview */}
                {isScanning && (
                  <div className="space-y-4">
                    {scannerMode === "device" && (
                      <DeviceCameraScanner
                        isScanning={isScanning}
                        setIsScanning={setIsScanning}
                        onQRDetected={handleQRDetected}
                        canvasRef={canvasRef}
                      />
                    )}

                    {scannerMode === "network" && (
                      <NetworkCameraScanner
                        isScanning={isScanning}
                        setIsScanning={setIsScanning}
                        onQRDetected={handleQRDetected}
                        canvasRef={canvasRef}
                      />
                    )}
                  </div>
                )}

                {/* Scanned Data Display */}
                {scannedData && (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        ✓ {qrType === "wifi" ? "Wi-Fi" : qrType === "product" ? "Product" : "QR Code"} scanned successfully
                      </p>
                    </div>

                    {/* WiFi QR Display */}
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
                              <button
                                onClick={() => copyToClipboard(scannedData.ssid || "")}
                                className="p-2 hover:bg-muted rounded-md transition-colors"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
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
                              <button
                                onClick={() => copyToClipboard(scannedData.password || "")}
                                className="p-2 hover:bg-muted rounded-md transition-colors"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
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

                    {/* Product QR Display */}
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
                              <button
                                onClick={() => copyToClipboard(scannedData.product || "")}
                                className="p-2 hover:bg-muted rounded-md transition-colors"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
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
                              <button
                                onClick={() => copyToClipboard(scannedData.gtin || "")}
                                className="p-2 hover:bg-muted rounded-md transition-colors"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
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
                                <button
                                  onClick={() => copyToClipboard(scannedData.serial || "")}
                                  className="p-2 hover:bg-muted rounded-md transition-colors"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
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
                                <button
                                  onClick={() => copyToClipboard(scannedData.batch || "")}
                                  className="p-2 hover:bg-muted rounded-md transition-colors"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
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

                    {/* Unknown Format */}
                    {qrType === "unknown" && scannedData && "ssid" in scannedData && (
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                          <p className="text-sm text-amber-800 dark:text-amber-200">Unknown QR code format detected</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Raw QR Data</label>
                          <textarea
                            value={scannedData.ssid}
                            readOnly
                            className="w-full px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={resetScanner}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Scan Another QR Code
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            <canvas ref={canvasRef} hidden />
          </div>
        </main>

        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  )
}
