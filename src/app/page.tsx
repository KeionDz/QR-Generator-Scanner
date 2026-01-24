"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Checkbox } from "../components/ui/checkbox"
import { Badge } from "../components/ui/badge"
import { Textarea } from "../components/ui/textarea"
import { useToast } from "../hooks/use-toast"
import { Toaster } from "../components/ui/toaster"
import { ThemeProvider } from "../components/theme-provider"
import { QRCodeSVG } from "qrcode.react"
import { Wifi, Download, Copy, Shield, Eye, EyeOff, Sparkles, Package } from "lucide-react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"

type SecurityType = "WPA" | "WEP" | "nopass"
type TabType = "wifi" | "product"

interface WifiConfig {
  ssid: string
  password: string
  security: SecurityType
  hidden: boolean
}

interface ProductConfig {
  productName: string
  gtin: string
  serialNumber: string
  batchLot: string
  expiryDate: string
  description: string
}

export default function QRGenerator() {
  const [activeTab, setActiveTab] = useState<TabType>("wifi")
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    ssid: "",
    password: "",
    security: "WPA",
    hidden: false,
  })
  const [productConfig, setProductConfig] = useState<ProductConfig>({
    productName: "",
    gtin: "",
    serialNumber: "",
    batchLot: "",
    expiryDate: "",
    description: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [wifiErrors, setWifiErrors] = useState<{ ssid?: string; password?: string }>({})
  const [productErrors, setProductErrors] = useState<{ productName?: string; gtin?: string }>({})
  const qrRef = useRef<SVGSVGElement>(null)
  const { toast } = useToast()
  const [isFormValid, setIsFormValid] = useState(false);

  const config = wifiConfig; // Assuming config refers to wifiConfig based on context
  const setConfig = setWifiConfig; // Assuming setConfig refers to setWifiConfig based on context
  const errors = wifiErrors; // Assuming errors refers to wifiErrors based on context
  const setErrors = setWifiErrors; // Assuming setErrors refers to setWifiErrors based on context

  useEffect(() => {
    const newWifiErrors: { ssid?: string; password?: string } = {}

    if (!wifiConfig.ssid.trim()) {
      newWifiErrors.ssid = "SSID is required"
    }

    if (wifiConfig.security !== "nopass" && !wifiConfig.password.trim()) {
      newWifiErrors.password = "Password is required for secured networks"
    }

    setWifiErrors(newWifiErrors)
    setIsFormValid(Object.keys(newWifiErrors).length === 0);
  }, [wifiConfig])

  useEffect(() => {
    const newProductErrors: { productName?: string; gtin?: string } = {}

    if (!productConfig.productName.trim()) {
      newProductErrors.productName = "Product name is required"
    }

    if (!productConfig.gtin.trim()) {
      newProductErrors.gtin = "GTIN/UPC is required"
    }

    setProductErrors(newProductErrors)
  }, [productConfig])

  const isWifiFormValid = useMemo(() => {
    if (!wifiConfig.ssid.trim()) return false
    if (wifiConfig.security !== "nopass" && !wifiConfig.password.trim()) return false
    return true
  }, [wifiConfig])

  const isProductFormValid = useMemo(() => {
    if (!productConfig.productName.trim()) return false
    if (!productConfig.gtin.trim()) return false
    return true
  }, [productConfig])

  const wifiString = useMemo(() => {
    if (!isWifiFormValid) return ""

    const { ssid, password, security, hidden } = wifiConfig
    const escapedSSID = ssid.replace(/[\\";,]/g, "\\$&")
    const escapedPassword = security !== "nopass" ? password.replace(/[\\";,]/g, "\\$&") : ""

    let wifiString = `WIFI:T:${security};S:${escapedSSID};`
    if (security !== "nopass") {
      wifiString += `P:${escapedPassword};`
    }
    wifiString += `H:${hidden};;`

    return wifiString
  }, [wifiConfig, isWifiFormValid])

  const productString = useMemo(() => {
    if (!isProductFormValid) return ""

    const { productName, gtin, serialNumber, batchLot, expiryDate, description } = productConfig
    
    // Build GS1 Digital Link format for product QR codes
    let qrData = `https://gs1.example.com/?gtin=${encodeURIComponent(gtin)}`
    qrData += `&product=${encodeURIComponent(productName)}`
    if (serialNumber) qrData += `&serial=${encodeURIComponent(serialNumber)}`
    if (batchLot) qrData += `&batch=${encodeURIComponent(batchLot)}`
    if (expiryDate) qrData += `&expiry=${encodeURIComponent(expiryDate)}`
    if (description) qrData += `&info=${encodeURIComponent(description)}`

    return qrData
  }, [productConfig, isProductFormValid])

  const downloadQR = useCallback(async () => {
    const qrData = activeTab === "wifi" ? wifiString : productString
    if (!qrData || !qrRef.current) return

    try {
      const svg = qrRef.current
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      canvas.width = 512
      canvas.height = 512

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "white"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `${activeTab}-${activeTab === "wifi" ? wifiConfig.ssid : productConfig.productName || "qr"}.png`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)

              toast({
                title: "QR Code Downloaded",
                description: `Your ${activeTab === "wifi" ? "Wi-Fi" : "Product"} QR code has been saved as PNG`,
              })
            }
          }, "image/png")
        }
      }

      img.src = "data:image/svg+xml;base64," + btoa(svgData)
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download QR code. Please try again.",
        variant: "destructive",
      })
    }
  }, [wifiString, productString, activeTab, wifiConfig.ssid, productConfig.productName, toast])

  const copyToClipboard = useCallback(async () => {
    const qrData = activeTab === "wifi" ? wifiString : productString
    if (!qrData) return

    try {
      await navigator.clipboard.writeText(qrData)
      toast({
        title: "Copied to Clipboard",
        description: `${activeTab === "wifi" ? "Wi-Fi configuration" : "Product information"} copied successfully`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }, [wifiString, productString, activeTab, toast])

  const generateWifiSample = useCallback(() => {
    setWifiConfig({
      ssid: "MyHomeWiFi",
      password: "SecurePassword123",
      security: "WPA",
      hidden: false,
    })
    setWifiErrors({})
    toast({
      title: "Sample Generated",
      description: "Demo Wi-Fi credentials have been filled in",
    })
  }, [toast])

  const generateProductSample = useCallback(() => {
    setProductConfig({
      productName: "Organic Coffee Beans",
      gtin: "5901234123457",
      serialNumber: "SN2024001",
      batchLot: "BATCH-2024-001",
      expiryDate: "2025-12-31",
      description: "Premium arabica coffee beans from Ethiopia",
    })
    setProductErrors({})
    toast({
      title: "Sample Generated",
      description: "Demo product information has been filled in",
    })
  }, [toast])

  const generateSample = useCallback(() => {
    if (activeTab === "wifi") {
      generateWifiSample()
    } else {
      generateProductSample()
    }
  }, [activeTab, generateWifiSample, generateProductSample])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-balance mb-4">KDMZ QR Generator</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Create professional QR codes for Wi-Fi networks and products instantly. Share securely and effortlessly.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b">
              <button
                onClick={() => setActiveTab("wifi")}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === "wifi"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Wi-Fi QR Generator
                </div>
              </button>
              <button
                onClick={() => setActiveTab("product")}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === "product"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product QR Generator
                </div>
              </button>
            </div>

            {/* WiFi Tab Content */}
            {activeTab === "wifi" && (
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Input Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Wi-Fi Configuration
                    </CardTitle>
                    <CardDescription>Enter your Wi-Fi network details to generate a QR code</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="ssid">Network Name (SSID) *</Label>
                      <Input
                        id="ssid"
                        placeholder="Enter Wi-Fi network name"
                        value={wifiConfig.ssid}
                        onChange={(e) => setWifiConfig((prev) => ({ ...prev, ssid: e.target.value }))}
                        className={wifiErrors.ssid ? "border-destructive" : ""}
                      />
                      {wifiErrors.ssid && <p className="text-sm text-destructive">{wifiErrors.ssid}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="security">Security Type</Label>
                      <Select
                        value={wifiConfig.security}
                        onValueChange={(value: SecurityType) =>
                          setWifiConfig((prev) => ({
                            ...prev,
                            security: value,
                            password: value === "nopass" ? "" : prev.password,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WPA">WPA/WPA2</SelectItem>
                          <SelectItem value="WEP">WEP</SelectItem>
                          <SelectItem value="nopass">No Password</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {wifiConfig.security !== "nopass" && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter Wi-Fi password"
                            value={wifiConfig.password}
                            onChange={(e) => setWifiConfig((prev) => ({ ...prev, password: e.target.value }))}
                            className={wifiErrors.password ? "border-destructive pr-10" : "pr-10"}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {wifiErrors.password && <p className="text-sm text-destructive">{wifiErrors.password}</p>}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hidden"
                        checked={wifiConfig.hidden}
                        onCheckedChange={(checked) => setWifiConfig((prev) => ({ ...prev, hidden: checked as boolean }))}
                      />
                      <Label htmlFor="hidden" className="text-sm font-normal">
                        Hidden network
                      </Label>
                    </div>

                    <Button onClick={generateWifiSample} variant="outline" className="w-full bg-transparent">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Sample
                    </Button>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        Your Wi-Fi details never leave this browser
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code Display */}
                <Card>
                  <CardHeader>
                    <CardTitle>QR Code Preview</CardTitle>
                    <CardDescription>Scan this code to connect to your Wi-Fi network</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {wifiString ? (
                      <>
                        <div className="flex justify-center p-6 bg-muted/30 rounded-lg">
                          <QRCodeSVG
                            ref={qrRef}
                            value={wifiString}
                            size={200}
                            level="M"
                            includeMargin
                            className="border rounded"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={downloadQR} className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download PNG
                          </Button>
                          <Button onClick={copyToClipboard} variant="outline" className="flex-1 bg-transparent">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="wifi-payload">Wi-Fi Configuration String</Label>
                          <Textarea id="wifi-payload" value={wifiString} readOnly className="font-mono text-sm" rows={3} />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            Security: {wifiConfig.security === "nopass" ? "Open" : wifiConfig.security}
                          </Badge>
                          {wifiConfig.hidden && <Badge variant="outline">Hidden Network</Badge>}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 bg-muted/30 rounded-full mb-4">
                          <Wifi className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Enter your Wi-Fi details to generate a QR code</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Product Tab Content */}
            {activeTab === "product" && (
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Product Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Product Information
                    </CardTitle>
                    <CardDescription>Enter product details to generate a GS1 Digital Link QR code</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="product-name">Product Name *</Label>
                      <Input
                        id="product-name"
                        placeholder="Enter product name"
                        value={productConfig.productName}
                        onChange={(e) => setProductConfig((prev) => ({ ...prev, productName: e.target.value }))}
                        className={productErrors.productName ? "border-destructive" : ""}
                      />
                      {productErrors.productName && <p className="text-sm text-destructive">{productErrors.productName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gtin">GTIN / UPC *</Label>
                      <Input
                        id="gtin"
                        placeholder="Enter GTIN (e.g., 5901234123457)"
                        value={productConfig.gtin}
                        onChange={(e) => setProductConfig((prev) => ({ ...prev, gtin: e.target.value }))}
                        className={productErrors.gtin ? "border-destructive" : ""}
                      />
                      {productErrors.gtin && <p className="text-sm text-destructive">{productErrors.gtin}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serial">Serial Number</Label>
                      <Input
                        id="serial"
                        placeholder="Enter serial number (optional)"
                        value={productConfig.serialNumber}
                        onChange={(e) => setProductConfig((prev) => ({ ...prev, serialNumber: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch/Lot Number</Label>
                      <Input
                        id="batch"
                        placeholder="Enter batch/lot number (optional)"
                        value={productConfig.batchLot}
                        onChange={(e) => setProductConfig((prev) => ({ ...prev, batchLot: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        type="date"
                        value={productConfig.expiryDate}
                        onChange={(e) => setProductConfig((prev) => ({ ...prev, expiryDate: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter product description (optional)"
                        value={productConfig.description}
                        onChange={(e) => setProductConfig((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <Button onClick={generateProductSample} variant="outline" className="w-full bg-transparent">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Sample
                    </Button>

                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        Uses GS1 Digital Link format for product traceability
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code Display */}
                <Card>
                  <CardHeader>
                    <CardTitle>QR Code Preview</CardTitle>
                    <CardDescription>Scan to view product information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {productString ? (
                      <>
                        <div className="flex justify-center p-6 bg-muted/30 rounded-lg">
                          <QRCodeSVG
                            ref={qrRef}
                            value={productString}
                            size={200}
                            level="M"
                            includeMargin
                            className="border rounded"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={downloadQR} className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download PNG
                          </Button>
                          <Button onClick={copyToClipboard} variant="outline" className="flex-1 bg-transparent">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="product-payload">Product Data String</Label>
                          <Textarea id="product-payload" value={productString} readOnly className="font-mono text-sm text-xs" rows={4} />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">GTIN: {productConfig.gtin}</Badge>
                          {productConfig.serialNumber && <Badge variant="outline">SN: {productConfig.serialNumber}</Badge>}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="p-4 bg-muted/30 rounded-full mb-4">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Enter product information to generate a QR code</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
