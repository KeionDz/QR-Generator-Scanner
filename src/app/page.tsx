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
import { Wifi, Download, Copy, Shield, Eye, EyeOff, Sparkles } from "lucide-react"
import { Header } from "../components/header"
import { Footer } from "../components/footer"

type SecurityType = "WPA" | "WEP" | "nopass"

interface WifiConfig {
  ssid: string
  password: string
  security: SecurityType
  hidden: boolean
}

export default function WifiQRGenerator() {
  const [config, setConfig] = useState<WifiConfig>({
    ssid: "",
    password: "",
    security: "WPA",
    hidden: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ ssid?: string; password?: string }>({})
  const [touched, setTouched] = useState<{ ssid?: boolean; password?: boolean }>({})
  const qrRef = useRef<SVGSVGElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    const newErrors: { ssid?: string; password?: string } = {}

    if (touched.ssid && !config.ssid.trim()) {
      newErrors.ssid = "SSID is required"
    }

    if (touched.password && config.security !== "nopass" && !config.password.trim()) {
      newErrors.password = "Password is required for secured networks"
    }

    setErrors(newErrors)
  }, [config, touched])

  const isFormValid = useMemo(() => {
    if (!config.ssid.trim()) return false
    if (config.security !== "nopass" && !config.password.trim()) return false
    return true
  }, [config])

  const wifiString = useMemo(() => {
    if (!isFormValid) return ""

    const { ssid, password, security, hidden } = config
    const escapedSSID = ssid.replace(/[\\";,]/g, "\\$&")
    const escapedPassword = security !== "nopass" ? password.replace(/[\\";,]/g, "\\$&") : ""

    let wifiString = `WIFI:T:${security};S:${escapedSSID};`
    if (security !== "nopass") {
      wifiString += `P:${escapedPassword};`
    }
    wifiString += `H:${hidden};;`

    return wifiString
  }, [config, isFormValid])

  const downloadQR = useCallback(async () => {
    if (!wifiString || !qrRef.current) return

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
              a.download = `wifi-${config.ssid || "qr"}.png`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)

              toast({
                title: "QR Code Downloaded",
                description: "Your Wi-Fi QR code has been saved as PNG",
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
  }, [wifiString, config.ssid, toast])

  const copyToClipboard = useCallback(async () => {
    if (!wifiString) return

    try {
      await navigator.clipboard.writeText(wifiString)
      toast({
        title: "Copied to Clipboard",
        description: "Wi-Fi configuration string copied successfully",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }, [wifiString, toast])

  const generateSample = useCallback(() => {
    setConfig({
      ssid: "MyHomeWiFi",
      password: "SecurePassword123",
      security: "WPA",
      hidden: false,
    })
    setErrors({})
    toast({
      title: "Sample Generated",
      description: "Demo Wi-Fi credentials have been filled in",
    })
  }, [toast])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-balance mb-4">Wi-Fi QR Code Generator</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Create QR codes for your Wi-Fi networks instantly. Share your internet connection with guests securely
                and effortlessly.
              </p>
            </div>

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
                      value={config.ssid}
                      onChange={(e) => setConfig((prev) => ({ ...prev, ssid: e.target.value }))}
                      onBlur={() => setTouched((prev) => ({ ...prev, ssid: true }))}
                      className={errors.ssid ? "border-destructive" : ""}
                    />
                    {errors.ssid && <p className="text-sm text-destructive">{errors.ssid}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="security">Security Type</Label>
                    <Select
                      value={config.security}
                      onValueChange={(value: SecurityType) =>
                        setConfig((prev) => ({
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

                  {config.security !== "nopass" && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter Wi-Fi password"
                          value={config.password}
                          onChange={(e) => setConfig((prev) => ({ ...prev, password: e.target.value }))}
                          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                          className={errors.password ? "border-destructive pr-10" : "pr-10"}
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
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hidden"
                      checked={config.hidden}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, hidden: checked as boolean }))}
                    />
                    <Label htmlFor="hidden" className="text-sm font-normal">
                      Hidden network
                    </Label>
                  </div>

                  <Button onClick={generateSample} variant="outline" className="w-full bg-transparent">
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
                        <Label htmlFor="payload">Wi-Fi Configuration String</Label>
                        <Textarea id="payload" value={wifiString} readOnly className="font-mono text-sm" rows={3} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          Security: {config.security === "nopass" ? "Open" : config.security}
                        </Badge>
                        {config.hidden && <Badge variant="outline">Hidden Network</Badge>}
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
          </div>
        </main>

        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
