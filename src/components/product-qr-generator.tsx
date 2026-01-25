"use client"

import React, { useState } from "react"

import { useCallback, useMemo } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Textarea } from "../components/ui/textarea"
import { QRCodeSVG } from "qrcode.react"
import { Package, Download, Copy, Shield, Sparkles, Palette } from "lucide-react"
import { QRCTAFrame } from "./qr-cta-frame"
import { downloadQRCodeWithBranding } from "./qr-download-util"

interface ProductConfig {
  productName: string
  gtin: string
  serialNumber: string
  batchLot: string
  expiryDate: string
  description: string
}

interface ProductQRGeneratorProps {
  config: ProductConfig
  setConfig: (config: ProductConfig) => void
  errors: { productName?: string; gtin?: string }
  setTouched: (touched: boolean) => void
  qrRef: React.RefObject<SVGSVGElement | null> 
  onDownload: () => Promise<void>
  onCopy: () => Promise<void>
  onGenerateSample: () => void
}

export function ProductQRGenerator({
  config,
  setConfig,
  errors,
  setTouched,
  qrRef,
  onDownload,
  onCopy,
  onGenerateSample,
}: ProductQRGeneratorProps) {
  const [patternColor, setPatternColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [ctaConfig, setCtaConfig] = useState({
    enabled: false,
    text: 'Scan for Product Info',
    frameType: 'top' as const,
    backgroundColor: '#f5f5f5',
    textColor: '#000000',
  })

  const isFormValid = useMemo(() => {
    if (!config.productName.trim()) return false
    if (!config.gtin.trim()) return false
    return true
  }, [config])

  const productString = useMemo(() => {
    if (!isFormValid) return ""

    const { productName, gtin, serialNumber, batchLot, expiryDate, description } = config

    // Build GS1 Digital Link format for product QR codes
    let qrData = `https://gs1.example.com/?gtin=${encodeURIComponent(gtin)}`
    qrData += `&product=${encodeURIComponent(productName)}`
    if (serialNumber) qrData += `&serial=${encodeURIComponent(serialNumber)}`
    if (batchLot) qrData += `&batch=${encodeURIComponent(batchLot)}`
    if (expiryDate) qrData += `&expiry=${encodeURIComponent(expiryDate)}`
    if (description) qrData += `&info=${encodeURIComponent(description)}`

    return qrData
  }, [config, isFormValid])

  return (
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
              value={config.productName}
              onChange={(e) => {
                setTouched(true)
                setConfig({ ...config, productName: e.target.value })
              }}
              className={errors.productName ? "border-destructive" : ""}
            />
            {errors.productName && <p className="text-sm text-destructive">{errors.productName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gtin">GTIN / UPC *</Label>
            <Input
              id="gtin"
              placeholder="Enter GTIN (e.g., 5901234123457)"
              value={config.gtin}
              onChange={(e) => {
                setTouched(true)
                setConfig({ ...config, gtin: e.target.value })
              }}
              className={errors.gtin ? "border-destructive" : ""}
            />
            {errors.gtin && <p className="text-sm text-destructive">{errors.gtin}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial">Serial Number</Label>
            <Input
              id="serial"
              placeholder="Enter serial number (optional)"
              value={config.serialNumber}
              onChange={(e) => setConfig({ ...config, serialNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch">Batch/Lot Number</Label>
            <Input
              id="batch"
              placeholder="Enter batch/lot number (optional)"
              value={config.batchLot}
              onChange={(e) => setConfig({ ...config, batchLot: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date</Label>
            <Input
              id="expiry"
              type="date"
              value={config.expiryDate}
              onChange={(e) => setConfig({ ...config, expiryDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter product description (optional)"
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              rows={2}
            />
          </div>

          <Button onClick={onGenerateSample} variant="outline" className="w-full bg-transparent">
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
              <div className="flex justify-center p-6 bg-muted/30 rounded-lg relative">
                <div style={{ backgroundColor }}>
                  <QRCodeSVG
                    ref={qrRef}
                    value={productString}
                    size={200}
                    level="M"
                    includeMargin
                    fgColor={patternColor}
                    bgColor={backgroundColor}
                    className="border rounded"
                  />
                </div>
                {logoUrl && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-lg p-1 flex items-center justify-center shadow-lg">
                    <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={async () => {
                  try {
                    await downloadQRCodeWithBranding({
                      value: productString,
                      filename: `product-${config.gtin || 'qr'}`,
                      patternColor,
                      backgroundColor,
                      logoUrl,
                      ctaConfig,
                    })
                  } catch (error) {
                    console.error('[v0] Download error:', error)
                  }
                }} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button onClick={onCopy} variant="outline" className="flex-1 bg-transparent">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-payload">Product Data String</Label>
                <Textarea id="product-payload" value={productString} readOnly className="font-mono text-sm text-xs" rows={4} />
              </div>

              {/* Branding Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <h3 className="font-semibold">Brand Customization</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="prod-pattern-color">QR Pattern Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="prod-pattern-color"
                        type="color"
                        value={patternColor}
                        onChange={(e) => setPatternColor(e.target.value)}
                        className="h-10 w-14 rounded cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{patternColor}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prod-bg-color">Background Color</Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="prod-bg-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-10 w-14 rounded cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{backgroundColor}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prod-logo">Brand Logo (Optional)</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="bg-transparent"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              setLogoUrl(event.target?.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }
                        input.click()
                      }}
                    >
                      Upload Logo
                    </Button>
                    {logoUrl && (
                      <Button
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => setLogoUrl('')}
                      >
                        Remove Logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA Frame */}
              <div className="pt-4 border-t">
                <QRCTAFrame config={ctaConfig} onChange={()=>setCtaConfig} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">GTIN: {config.gtin}</Badge>
                {config.serialNumber && <Badge variant="outline">SN: {config.serialNumber}</Badge>}
                {logoUrl && <Badge variant="secondary">Branded Logo</Badge>}
                {ctaConfig.enabled && <Badge variant="secondary">CTA Frame</Badge>}
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
  )
}
