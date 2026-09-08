"use client"

import { useMemo } from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import { useToast } from "../hooks/use-toast"
import { Toaster } from "../components/ui/toaster"
import { ThemeProvider } from "../components/theme-provider"
import { Wifi, Package } from "lucide-react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"
import { WifiQRGenerator } from "../components/wifi-qr-generator"
import { ProductQRGenerator } from "../components/product-qr-generator"
import { ActionQRGenerator } from "../components/action-qr-generator"
import { MenuQRGenerator } from "../components/menu-qr-generator"
import { NuDavaoQRGenerator } from "../components/nu-davao-qr-generator"
import { Zap, UtensilsCrossed, GraduationCap } from "lucide-react"

type TabType = "wifi" | "product" | "action" | "menu" | "nu"

interface WifiConfig {
  ssid: string
  password: string
  security: "WPA" | "WEP" | "nopass"
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
  const [wifiTouched, setWifiTouched] = useState(false)
  const [productTouched, setProductTouched] = useState(false)
  const qrRef = useRef<SVGSVGElement>(null)
  const { toast } = useToast()

  const wifiString = useMemo(() => {
    if (!wifiConfig.ssid || (wifiConfig.security !== "nopass" && !wifiConfig.password)) return ""
    return `WIFI:T:${wifiConfig.security};S:${wifiConfig.ssid};P:${wifiConfig.password};H:${wifiConfig.hidden ? "true" : "false"};;`
  }, [wifiConfig])

  const productString = useMemo(() => {
    if (!productConfig.productName || !productConfig.gtin) return ""
    return `https://example.com/product?gtin=${productConfig.gtin}&serial=${productConfig.serialNumber}&batch=${productConfig.batchLot}&expiry=${productConfig.expiryDate}&description=${encodeURIComponent(productConfig.description)}`
  }, [productConfig])

  useEffect(() => {
    if (!wifiTouched) return
    const newWifiErrors: { ssid?: string; password?: string } = {}
    if (!wifiConfig.ssid.trim()) {
      newWifiErrors.ssid = "SSID is required"
    }
    if (wifiConfig.security !== "nopass" && !wifiConfig.password.trim()) {
      newWifiErrors.password = "Password is required for secured networks"
    }
    setWifiErrors(newWifiErrors)
  }, [wifiConfig, wifiTouched])

  useEffect(() => {
    if (!productTouched) return
    const newProductErrors: { productName?: string; gtin?: string } = {}
    if (!productConfig.productName.trim()) {
      newProductErrors.productName = "Product name is required"
    }
    if (!productConfig.gtin.trim()) {
      newProductErrors.gtin = "GTIN/UPC is required"
    }
    setProductErrors(newProductErrors)
  }, [productConfig, productTouched])

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
            <div className="flex flex-wrap gap-2 mb-8 border-b">
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
              <button
                onClick={() => setActiveTab("action")}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === "action"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Action QR
                </div>
              </button>
              <button
                onClick={() => setActiveTab("menu")}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === "menu"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Menu QR
                </div>
              </button>
              <button
                onClick={() => setActiveTab("nu")}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === "nu"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  NU Davao
                </div>
              </button>
            </div>

            {/* WiFi Tab Content */}
            {activeTab === "wifi" && (
              <WifiQRGenerator
                config={wifiConfig}
                setConfig={setWifiConfig}
                errors={wifiErrors}
                setTouched={setWifiTouched}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                qrRef={qrRef}
                onDownload={downloadQR}
                onCopy={copyToClipboard}
                onGenerateSample={generateWifiSample}
              />
            )}

            {/* Product Tab Content */}
            {activeTab === "product" && (
              <ProductQRGenerator
                config={productConfig}
                setConfig={setProductConfig}
                errors={productErrors}
                setTouched={setProductTouched}
                qrRef={qrRef}
                onDownload={downloadQR}
                onCopy={copyToClipboard}
                onGenerateSample={generateProductSample}
              />
            )}

            {/* Action QR Tab Content */}
            {activeTab === "action" && <ActionQRGenerator />}

            {/* Menu QR Tab Content */}
            {activeTab === "menu" && <MenuQRGenerator />}

            {/* NU Davao Link QR Tab Content */}
            {activeTab === "nu" && <NuDavaoQRGenerator />}


          </div>
        </main>

        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
