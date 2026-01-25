"use client"

import React from "react"

import { useCallback, useRef, useMemo } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Checkbox } from "../components/ui/checkbox"
import { Badge } from "../components/ui/badge"
import { Textarea } from "../components/ui/textarea"
import { useToast } from "../hooks/use-toast"
import { QRCodeSVG } from "qrcode.react"
import { Wifi, Download, Copy, Shield, Eye, EyeOff, Sparkles } from "lucide-react"

type SecurityType = "WPA" | "WEP" | "nopass"

interface WifiConfig {
  ssid: string
  password: string
  security: SecurityType
  hidden: boolean
}

interface WifiQRGeneratorProps {
  config: WifiConfig
  setConfig: (config: WifiConfig) => void
  errors: { ssid?: string; password?: string }
  setTouched: (touched: boolean) => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  qrRef: React.RefObject<SVGSVGElement>
  onDownload: () => Promise<void>
  onCopy: () => Promise<void>
  onGenerateSample: () => void
}

export function WifiQRGenerator({
  config,
  setConfig,
  errors,
  setTouched,
  showPassword,
  setShowPassword,
  qrRef,
  onDownload,
  onCopy,
  onGenerateSample,
}: WifiQRGeneratorProps) {
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

  return (
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
              onChange={(e) => {
                setTouched(true)
                setConfig({ ...config, ssid: e.target.value })
              }}
              className={errors.ssid ? "border-destructive" : ""}
            />
            {errors.ssid && <p className="text-sm text-destructive">{errors.ssid}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="security">Security Type</Label>
            <Select
              value={config.security}
              onValueChange={(value: SecurityType) =>
                setConfig({
                  ...config,
                  security: value,
                  password: value === "nopass" ? "" : config.password,
                })
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
                  onChange={(e) => {
                    setTouched(true)
                    setConfig({ ...config, password: e.target.value })
                  }}
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
              onCheckedChange={(checked) => setConfig({ ...config, hidden: checked as boolean })}
            />
            <Label htmlFor="hidden" className="text-sm font-normal">
              Hidden network
            </Label>
          </div>

          <Button onClick={onGenerateSample} variant="outline" className="w-full bg-transparent">
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
                <Button onClick={onDownload} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button onClick={onCopy} variant="outline" className="flex-1 bg-transparent">
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
  )
}
