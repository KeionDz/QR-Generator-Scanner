'use client'

/**
 * NU Davao link QR codes — forms, sites, portals.
 *
 * The visual design is not invented here. It is carried over from the NU Davao
 * room-booking project's design tokens and its server-side QR renderer: navy
 * #262D65, primary blue #35408E, gold #FFD41C, and the rule that gold is an
 * accent and never carries text on a light ground. `nu-qr-render.ts` holds the
 * code-drawing half of that; this file is the form around it.
 *
 * Preview and download are the same canvas, so what a person approves on
 * screen is byte-for-byte what they print.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Checkbox } from '../components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { AlertTriangle, Copy, Download, GraduationCap, Link2, Sparkles } from 'lucide-react'
import { useToast } from '../hooks/use-toast'
import {
  downloadNuQr,
  NU_GOLD,
  NU_NAVY,
  renderNuQr,
  type NuQrStyle,
} from './nu-qr-render'

type LinkKind = 'form' | 'site' | 'portal' | 'social' | 'doc' | 'booking' | 'custom'

interface LinkPreset {
  label: string
  /** What the caption band says by default. */
  caption: string
  /** Shown under the URL field as a hint about what to paste. */
  hint: string
}

const LINK_PRESETS: Record<LinkKind, LinkPreset> = {
  form: {
    label: 'Form / Survey',
    caption: 'Scan to Answer the Form',
    hint: 'Paste the Google Form or Microsoft Forms share link.',
  },
  site: {
    label: 'Website / Page',
    caption: 'Scan to Visit',
    hint: 'Any public page — the NU Davao site, a landing page, an article.',
  },
  portal: {
    label: 'Student Portal',
    caption: 'Scan to Open the Portal',
    hint: 'The portal or LMS sign-in page. The code carries the link only.',
  },
  social: {
    label: 'Social Page',
    caption: 'Scan to Follow Us',
    hint: 'A Facebook page, an event, or another public profile.',
  },
  doc: {
    label: 'Document / Drive',
    caption: 'Scan to View the Document',
    hint: 'Check the sharing setting first — a private link scans to a login wall.',
  },
  booking: {
    label: 'Room Booking',
    caption: 'Scan to Book a Room',
    hint: 'The room-booking app, or a specific room’s page.',
  },
  custom: {
    label: 'Other',
    caption: '',
    hint: 'Anything else. Write your own caption below.',
  },
}

const STYLE_OPTIONS: { value: NuQrStyle; label: string }[] = [
  { value: 'navy-on-gold', label: 'Navy on gold — recommended' },
  { value: 'navy-on-white', label: 'Navy on white — plain fallback' },
  { value: 'gold-on-navy', label: 'Gold on navy — reversed' },
]

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'nu-davao-qr'
}

export function NuDavaoQRGenerator() {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [linkKind, setLinkKind] = useState<LinkKind>('form')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState(LINK_PRESETS.form.caption)
  const [style, setStyle] = useState<NuQrStyle>('navy-on-gold')
  const [showLogo, setShowLogo] = useState(true)
  const [showFrame, setShowFrame] = useState(true)
  const [touched, setTouched] = useState(false)

  const preset = LINK_PRESETS[linkKind]
  const qrValue = useMemo(() => normalizeUrl(url), [url])

  const urlError = useMemo(() => {
    if (!touched) return null
    if (!url.trim()) return 'A link is required'
    try {
      const parsed = new URL(qrValue)
      if (!parsed.hostname.includes('.')) return 'That does not look like a real address'
      return null
    } catch {
      return 'That is not a valid link'
    }
  }, [touched, url, qrValue])

  const isHttp = useMemo(() => /^http:\/\//i.test(qrValue), [qrValue])
  const isValid = !!qrValue && !urlError && (() => {
    try {
      return new URL(qrValue).hostname.includes('.')
    } catch {
      return false
    }
  })()

  const handleKindChange = useCallback((value: string) => {
    const kind = value as LinkKind
    setLinkKind(kind)
    // Only overwrite a caption the person has not customised away from a preset.
    setCaption((current) => {
      const isPresetCaption = Object.values(LINK_PRESETS).some((p) => p.caption === current)
      return isPresetCaption || !current ? LINK_PRESETS[kind].caption : current
    })
  }, [])

  // Draw whenever anything that affects the pixels changes. The cancel flag
  // keeps a slow shield load from painting over a newer render.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isValid) return

    let cancelled = false
    void (async () => {
      try {
        const scratch = document.createElement('canvas')
        await renderNuQr(scratch, qrValue, {
          style,
          logo: showLogo,
          frame: showFrame,
          caption,
        })
        if (cancelled) return
        canvas.width = scratch.width
        canvas.height = scratch.height
        canvas.getContext('2d')?.drawImage(scratch, 0, 0)
      } catch (error) {
        if (cancelled) return
        console.error('[nu-qr] render failed:', error)
        toast({
          title: 'Could not draw the QR code',
          description: 'The link may be too long to encode. Try a shortened link.',
          variant: 'destructive',
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [qrValue, style, showLogo, showFrame, caption, isValid, toast])

  const handleDownload = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !isValid) return
    try {
      await downloadNuQr(canvas, `nu-davao-${slugify(title || preset.label)}`)
      toast({
        title: 'QR code downloaded',
        description: 'Saved as a PNG at print resolution.',
      })
    } catch {
      toast({
        title: 'Download failed',
        description: 'Could not save the QR code. Please try again.',
        variant: 'destructive',
      })
    }
  }, [isValid, title, preset.label, toast])

  const handleCopy = useCallback(async () => {
    if (!qrValue) return
    try {
      await navigator.clipboard.writeText(qrValue)
      toast({ title: 'Link copied', description: 'The encoded link is on your clipboard.' })
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard. Please try again.',
        variant: 'destructive',
      })
    }
  }, [qrValue, toast])

  const loadSample = useCallback(() => {
    setLinkKind('form')
    setUrl('https://forms.gle/nu-davao-feedback')
    setTitle('Student Feedback Form')
    setCaption(LINK_PRESETS.form.caption)
    setTouched(true)
    toast({ title: 'Sample loaded', description: 'Demo NU Davao form link filled in.' })
  }, [toast])

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Link details */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: NU_GOLD }} />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" style={{ color: NU_NAVY }} />
            NU Davao Link
          </CardTitle>
          <CardDescription>
            Turn a form, site, or portal link into a QR code in National University Davao’s colours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nu-link-kind">What does this link go to?</Label>
            <Select value={linkKind} onValueChange={handleKindChange}>
              <SelectTrigger id="nu-link-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LINK_PRESETS) as LinkKind[]).map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {LINK_PRESETS[kind].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nu-url">Link *</Label>
            <Input
              id="nu-url"
              type="url"
              inputMode="url"
              placeholder="https://forms.gle/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={!!urlError}
              aria-describedby="nu-url-hint"
            />
            <p id="nu-url-hint" className="text-sm text-muted-foreground">
              {preset.hint}
            </p>
            {urlError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {urlError}
              </p>
            )}
            {!urlError && isHttp && (
              <p className="text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                This is an http:// link. Prefer https:// so phones do not warn on scan.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nu-title">Title</Label>
            <Input
              id="nu-title"
              placeholder="Student Feedback Form"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Used to name the downloaded file. Not encoded in the code.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nu-caption">Caption band</Label>
            <Input
              id="nu-caption"
              placeholder="Scan to Answer the Form"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={60}
            />
            <p className="text-sm text-muted-foreground">
              Printed under the code, outside the quiet zone. Leave empty for no band.
            </p>
          </div>

          <Button variant="outline" onClick={loadSample} className="w-full">
            <Sparkles className="h-4 w-4" />
            Load a sample
          </Button>
        </CardContent>
      </Card>

      {/* Preview and styling */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: NU_GOLD }} />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" style={{ color: NU_NAVY }} />
            QR Code
          </CardTitle>
          <CardDescription>
            Error correction is fixed at level H, and the shield never grows past the budget that
            leaves.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isValid ? (
            <>
              {/* A fixed light surround, in both themes on purpose: a dark
                  plate behind a light-ground code eats into how cleanly a
                  camera can find the quiet zone. */}
              <div
                className="flex justify-center rounded-lg p-4"
                style={{ backgroundColor: '#f6f8fc' }}
              >
                <canvas
                  ref={canvasRef}
                  className="h-auto w-full max-w-[320px] rounded"
                  aria-label={`QR code for ${title || preset.label}`}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleDownload} className="flex-1">
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
                <Button variant="outline" onClick={handleCopy} className="flex-1">
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
              </div>
            </>
          ) : (
            <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
              <GraduationCap className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Enter a link to see the NU Davao QR code
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nu-style">Colour treatment</Label>
            <Select value={style} onValueChange={(value) => setStyle(value as NuQrStyle)}>
              <SelectTrigger id="nu-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {style === 'gold-on-navy' && (
              <p className="text-sm text-amber-600 dark:text-amber-500 flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Light modules on a dark ground is a reversed code — the opposite of what the QR
                standard specifies. The NU room-booking project measured it failing at 5 of 13 print
                sizes, and not every scanner app accepts reversed polarity. Use it only where you
                can test the exact size you will print.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="nu-logo"
                checked={showLogo}
                onCheckedChange={(checked) => setShowLogo(checked === true)}
              />
              <Label htmlFor="nu-logo" className="font-normal">
                Centre the NU shield
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="nu-frame"
                checked={showFrame}
                onCheckedChange={(checked) => setShowFrame(checked === true)}
              />
              <Label htmlFor="nu-frame" className="font-normal">
                Draw the navy frame
              </Label>
            </div>
          </div>

          {isValid && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="nu-payload">Encoded link</Label>
                <Badge variant="secondary">Level H</Badge>
              </div>
              <Textarea
                id="nu-payload"
                value={qrValue}
                readOnly
                rows={2}
                className="font-mono text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
