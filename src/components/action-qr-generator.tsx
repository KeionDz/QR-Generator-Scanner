'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { useToast } from '../hooks/use-toast'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Download, Zap } from 'lucide-react'
import { useRef } from 'react'

type ActionType = 'menu' | 'review' | 'receipt' | 'promo'

interface MenuQRConfig {
  menuUrl: string
  businessName: string
  updateFrequency: 'real-time' | 'daily' | 'weekly'
}

interface ReviewQRConfig {
  businessName: string
  businessId: string
  reviewPlatform: 'google' | 'trustpilot' | 'custom'
  customUrl?: string
}

interface ReceiptQRConfig {
  feedbackUrl: string
  discountCode: string
  discountValue: number
  expiryDate: string
}

interface PromoQRConfig {
  promoTitle: string
  promoDescription: string
  discountCode: string
  discountValue: number
  expiryDate: string
  promoUrl: string
}

export function ActionQRGenerator() {
  const [actionType, setActionType] = useState<ActionType>('menu')
  const [menuConfig, setMenuConfig] = useState<MenuQRConfig>({
    menuUrl: '',
    businessName: '',
    updateFrequency: 'real-time',
  })
  const [reviewConfig, setReviewConfig] = useState<ReviewQRConfig>({
    businessName: '',
    businessId: '',
    reviewPlatform: 'google',
  })
  const [receiptConfig, setReceiptConfig] = useState<ReceiptQRConfig>({
    feedbackUrl: '',
    discountCode: '',
    discountValue: 10,
    expiryDate: '',
  })
  const [promoConfig, setPromoConfig] = useState<PromoQRConfig>({
    promoTitle: '',
    promoDescription: '',
    discountCode: '',
    discountValue: 20,
    expiryDate: '',
    promoUrl: '',
  })

  const qrRef = useRef<SVGSVGElement>(null)
  const { toast } = useToast()

  const generateMenuQRUrl = useCallback(() => {
    if (!menuConfig.menuUrl || !menuConfig.businessName) return ''
    return `https://menu-qr.example.com/?url=${encodeURIComponent(menuConfig.menuUrl)}&business=${encodeURIComponent(menuConfig.businessName)}&update=${menuConfig.updateFrequency}`
  }, [menuConfig])

  const generateReviewQRUrl = useCallback(() => {
    if (!reviewConfig.businessName || !reviewConfig.businessId) return ''
    if (reviewConfig.reviewPlatform === 'google') {
      return `https://search.google.com/local/writereview?placeid=${reviewConfig.businessId}`
    } else if (reviewConfig.reviewPlatform === 'trustpilot') {
      return `https://www.trustpilot.com/review/${reviewConfig.businessId}`
    }
    return reviewConfig.customUrl || ''
  }, [reviewConfig])

  const generateReceiptQRUrl = useCallback(() => {
    if (!receiptConfig.feedbackUrl || !receiptConfig.discountCode) return ''
    return `https://receipt-qr.example.com/?feedback=${encodeURIComponent(receiptConfig.feedbackUrl)}&code=${receiptConfig.discountCode}&discount=${receiptConfig.discountValue}&expires=${receiptConfig.expiryDate}`
  }, [receiptConfig])

  const generatePromoQRUrl = useCallback(() => {
    if (!promoConfig.promoTitle || !promoConfig.discountCode) return ''
    return `https://promo-qr.example.com/?title=${encodeURIComponent(promoConfig.promoTitle)}&desc=${encodeURIComponent(promoConfig.promoDescription)}&code=${promoConfig.discountCode}&discount=${promoConfig.discountValue}&expires=${promoConfig.expiryDate}&url=${encodeURIComponent(promoConfig.promoUrl)}`
  }, [promoConfig])

  const getCurrentQRUrl = useCallback(() => {
    switch (actionType) {
      case 'menu':
        return generateMenuQRUrl()
      case 'review':
        return generateReviewQRUrl()
      case 'receipt':
        return generateReceiptQRUrl()
      case 'promo':
        return generatePromoQRUrl()
      default:
        return ''
    }
  }, [actionType, generateMenuQRUrl, generateReviewQRUrl, generateReceiptQRUrl, generatePromoQRUrl])

  const downloadQR = useCallback(async () => {
    if (!qrRef.current) return

    try {
      const svg = qrRef.current
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      canvas.width = 512
      canvas.height = 512

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${actionType}-qr-code.png`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)

              toast({
                title: 'QR Code Downloaded',
                description: `Your ${actionType} QR code has been saved`,
              })
            }
          }, 'image/png')
        }
      }

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download QR code',
        variant: 'destructive',
      })
    }
  }, [actionType, toast])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentQRUrl())
      toast({
        title: 'Copied',
        description: 'QR URL copied to clipboard',
      })
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const qrValue = getCurrentQRUrl()

  return (
    <div className="space-y-6">
      {/* Action Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Action-Based QR Generator
          </CardTitle>
          <CardDescription>Create intelligent QR codes with built-in actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="action-type">Select Action Type</Label>
            <Select value={actionType} onValueChange={(value: ActionType) => setActionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="menu">
                  <div className="flex items-center gap-2">Menu QR - Real-time pricing updates</div>
                </SelectItem>
                <SelectItem value="review">
                  <div className="flex items-center gap-2">Review QR - Google Review integration</div>
                </SelectItem>
                <SelectItem value="receipt">
                  <div className="flex items-center gap-2">Receipt QR - Feedback + Discount</div>
                </SelectItem>
                <SelectItem value="promo">
                  <div className="flex items-center gap-2">Promo QR - Time-limited deals</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {actionType === 'menu' && 'Menu QR Configuration'}
              {actionType === 'review' && 'Review QR Configuration'}
              {actionType === 'receipt' && 'Receipt QR Configuration'}
              {actionType === 'promo' && 'Promo QR Configuration'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionType === 'menu' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="menu-url">Menu URL *</Label>
                  <Input
                    id="menu-url"
                    placeholder="https://your-menu.com"
                    value={menuConfig.menuUrl}
                    onChange={(e) => setMenuConfig({ ...menuConfig, menuUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input
                    id="business-name"
                    placeholder="Your Restaurant"
                    value={menuConfig.businessName}
                    onChange={(e) => setMenuConfig({ ...menuConfig, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="update-freq">Update Frequency</Label>
                  <Select
                    value={menuConfig.updateFrequency}
                    onValueChange={(value: 'real-time' | 'daily' | 'weekly') =>
                      setMenuConfig({ ...menuConfig, updateFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real-time">Real-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {actionType === 'review' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="review-business">Business Name *</Label>
                  <Input
                    id="review-business"
                    placeholder="Your Business"
                    value={reviewConfig.businessName}
                    onChange={(e) => setReviewConfig({ ...reviewConfig, businessName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-platform">Review Platform</Label>
                  <Select
                    value={reviewConfig.reviewPlatform}
                    onValueChange={(value: 'google' | 'trustpilot' | 'custom') =>
                      setReviewConfig({ ...reviewConfig, reviewPlatform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Reviews</SelectItem>
                      <SelectItem value="trustpilot">Trustpilot</SelectItem>
                      <SelectItem value="custom">Custom URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {reviewConfig.reviewPlatform === 'custom' ? (
                  <div className="space-y-2">
                    <Label htmlFor="custom-url">Custom Review URL</Label>
                    <Input
                      id="custom-url"
                      placeholder="https://your-review-url.com"
                      value={reviewConfig.customUrl || ''}
                      onChange={(e) => setReviewConfig({ ...reviewConfig, customUrl: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="business-id">Business ID / Place ID *</Label>
                    <Input
                      id="business-id"
                      placeholder="Your business ID"
                      value={reviewConfig.businessId}
                      onChange={(e) => setReviewConfig({ ...reviewConfig, businessId: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            {actionType === 'receipt' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="feedback-url">Feedback Form URL *</Label>
                  <Input
                    id="feedback-url"
                    placeholder="https://feedback.example.com/form"
                    value={receiptConfig.feedbackUrl}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, feedbackUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-code">Discount Code *</Label>
                  <Input
                    id="discount-code"
                    placeholder="SAVE10"
                    value={receiptConfig.discountCode}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, discountCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-val">Discount Value (%)</Label>
                  <Input
                    id="discount-val"
                    type="number"
                    value={receiptConfig.discountValue}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, discountValue: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={receiptConfig.expiryDate}
                    onChange={(e) => setReceiptConfig({ ...receiptConfig, expiryDate: e.target.value })}
                  />
                </div>
              </>
            )}

            {actionType === 'promo' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="promo-title">Promo Title *</Label>
                  <Input
                    id="promo-title"
                    placeholder="Summer Sale"
                    value={promoConfig.promoTitle}
                    onChange={(e) => setPromoConfig({ ...promoConfig, promoTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-desc">Promo Description</Label>
                  <Textarea
                    id="promo-desc"
                    placeholder="Limited time offer..."
                    value={promoConfig.promoDescription}
                    onChange={(e) => setPromoConfig({ ...promoConfig, promoDescription: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-code">Discount Code *</Label>
                  <Input
                    id="promo-code"
                    placeholder="SAVE20"
                    value={promoConfig.discountCode}
                    onChange={(e) => setPromoConfig({ ...promoConfig, discountCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-discount">Discount Value (%)</Label>
                  <Input
                    id="promo-discount"
                    type="number"
                    value={promoConfig.discountValue}
                    onChange={(e) => setPromoConfig({ ...promoConfig, discountValue: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-expiry">Expiry Date</Label>
                  <Input
                    id="promo-expiry"
                    type="date"
                    value={promoConfig.expiryDate}
                    onChange={(e) => setPromoConfig({ ...promoConfig, expiryDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promo-url">Promo Landing Page URL *</Label>
                  <Input
                    id="promo-url"
                    placeholder="https://your-promo.com"
                    value={promoConfig.promoUrl}
                    onChange={(e) => setPromoConfig({ ...promoConfig, promoUrl: e.target.value })}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* QR Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrValue ? (
              <>
                <div className="flex justify-center p-6 bg-muted/30 rounded-lg">
                  <QRCodeSVG
                    ref={qrRef}
                    value={qrValue}
                    size={200}
                    level="M"
                    includeMargin
                    className="border rounded"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadQR} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1 bg-transparent">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">QR Data</Label>
                  <Textarea value={qrValue} readOnly className="font-mono text-xs" rows={3} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {actionType === 'menu' && 'Menu QR'}
                    {actionType === 'review' && 'Review QR'}
                    {actionType === 'receipt' && 'Receipt QR'}
                    {actionType === 'promo' && 'Promo QR'}
                  </Badge>
                  {actionType === 'receipt' && <Badge variant="outline">Feedback {receiptConfig.discountValue}% OFF</Badge>}
                  {actionType === 'promo' && <Badge variant="outline">{promoConfig.discountValue}% OFF</Badge>}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-center text-muted-foreground">
                Fill in the required fields to generate QR code
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
