'use client'

import React from "react"

import { useRef, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Upload, Download, Copy } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

interface QRCustomizerProps {
  qrValue: string
  patternColor?: string
  backgroundColor?: string
  onPatternColorChange?: (color: string) => void
  onBackgroundColorChange?: (color: string) => void
  onLogoUpload?: (logoUrl: string) => void
  logoUrl?: string
  includeFrame?: boolean
  frameText?: string
  onDownload?: () => void
}

export function QRCustomizer({
  qrValue,
  patternColor = '#000000',
  backgroundColor = '#ffffff',
  onPatternColorChange,
  onBackgroundColorChange,
  onLogoUpload,
  logoUrl,
  includeFrame = false,
  frameText = '',
  onDownload,
}: QRCustomizerProps) {
  const qrRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      onLogoUpload?.(url)
    }
    reader.readAsDataURL(file)
  }

  const downloadQRWithLogo = async () => {
    if (!qrRef.current || !canvasRef.current) return

    try {
      const svg = qrRef.current
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) return

      canvas.width = 512
      canvas.height = includeFrame ? 612 : 512

      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw QR code
        ctx.drawImage(img, 0, includeFrame ? 60 : 0, 512, 512)

        // Draw frame if enabled
        if (includeFrame && frameText) {
          ctx.fillStyle = patternColor
          ctx.font = 'bold 32px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(frameText, 256, 45)
        }

        // Draw logo if provided
        if (logoUrl) {
          const logoImg = new Image()
          logoImg.crossOrigin = 'anonymous'
          logoImg.onload = () => {
            const logoSize = 100
            const logoX = 256 - logoSize / 2
            const logoY = includeFrame ? 256 + 30 : 206

            // White background for logo
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)

            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)

            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'qr-code-branded.png'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                toast({
                  title: 'QR Code Downloaded',
                  description: 'Your branded QR code has been saved',
                })
              }
            }, 'image/png')
          }
          logoImg.src = logoUrl
        } else {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'qr-code.png'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)

              toast({
                title: 'QR Code Downloaded',
                description: 'Your QR code has been saved',
              })
            }
          }, 'image/png')
        }
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    } catch (error) {
      console.error('[v0] Error downloading QR code:', error)
      toast({
        title: 'Download Failed',
        description: 'Could not download QR code',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrValue)
      toast({
        title: 'Copied',
        description: 'QR code data copied to clipboard',
      })
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your QR Code</CardTitle>
        <CardDescription>Add branding and styling to your QR code</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Preview */}
        <div className="flex justify-center p-6 bg-muted/30 rounded-lg relative">
          <div
            style={{ backgroundColor }}
            className="p-4 rounded-lg"
          >
            <QRCodeSVG
              ref={qrRef}
              value={qrValue}
              size={200}
              level="M"
              includeMargin
              fgColor={patternColor}
              bgColor={backgroundColor}
              className="border rounded"
            />
          </div>
          {logoUrl && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-lg p-1 flex items-center justify-center">
              <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Color Customization */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pattern-color">QR Pattern Color</Label>
            <div className="flex gap-2 items-center">
              <input
                id="pattern-color"
                type="color"
                value={patternColor}
                onChange={(e) => onPatternColorChange?.(e.target.value)}
                className="h-10 w-14 rounded cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{patternColor}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex gap-2 items-center">
              <input
                id="bg-color"
                type="color"
                value={backgroundColor}
                onChange={(e) => onBackgroundColorChange?.(e.target.value)}
                className="h-10 w-14 rounded cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">{backgroundColor}</span>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label htmlFor="logo">Brand Logo (Optional)</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-transparent"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Logo
            </Button>
            {logoUrl && (
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => onLogoUpload?.('')}
              >
                Remove Logo
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
          {logoUrl && (
            <p className="text-xs text-muted-foreground">Logo uploaded - will appear centered on QR code</p>
          )}
        </div>

        {/* Download and Copy */}
        <div className="flex gap-2">
          <Button onClick={downloadQRWithLogo} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          <Button onClick={copyToClipboard} variant="outline" className="flex-1 bg-transparent">
            <Copy className="h-4 w-4 mr-2" />
            Copy Data
          </Button>
        </div>
      </CardContent>

      <canvas ref={canvasRef} className="hidden" />
    </Card>
  )
}
