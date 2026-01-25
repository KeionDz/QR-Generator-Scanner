'use client'

import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'

interface CTAFrameConfig {
  enabled: boolean
  text: string
  frameType: 'top' | 'bottom' | 'full'
  backgroundColor?: string
  textColor?: string
}

interface QRCTAFrameProps {
  config: CTAFrameConfig
  onChange: (config: CTAFrameConfig) => void
}

const CTA_PRESETS = [
  { label: 'Scan for Menu', value: 'Scan for Menu' },
  { label: 'Scan for WiFi', value: 'Scan for WiFi' },
  { label: 'Scan to Order', value: 'Scan to Order' },
  { label: 'Scan for Review', value: 'Scan for Review' },
  { label: 'Scan for Promo', value: 'Scan for Promo' },
  { label: 'Scan for Feedback', value: 'Scan for Feedback' },
  { label: 'Scan to Pay', value: 'Scan to Pay' },
  { label: 'Custom', value: 'custom' },
]

export function QRCTAFrame({ config, onChange }: QRCTAFrameProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CTA Frame</CardTitle>
        <CardDescription>Add a call-to-action around your QR code</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="enable-frame"
            checked={config.enabled}
            onCheckedChange={(checked) =>
              onChange({ ...config, enabled: checked as boolean })
            }
          />
          <Label htmlFor="enable-frame" className="text-sm font-normal">
            Enable CTA Frame
          </Label>
        </div>

        {config.enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="frame-type">Frame Position</Label>
              <Select
                value={config.frameType}
                onValueChange={(value: 'top' | 'bottom' | 'full') =>
                  onChange({ ...config, frameType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="full">Top & Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta-preset">Quick Presets</Label>
              <Select
                value={config.text === '' ? 'custom' : config.text}
                onValueChange={(value) => {
                  if (value !== 'custom') {
                    onChange({ ...config, text: value })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CTA_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta-text">Custom Text</Label>
              <Input
                id="cta-text"
                placeholder="Enter custom CTA text"
                value={config.text}
                onChange={(e) => onChange({ ...config, text: e.target.value })}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">{config.text.length}/50 characters</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frame-bg">Frame Background</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="frame-bg"
                    type="color"
                    value={config.backgroundColor || '#f5f5f5'}
                    onChange={(e) =>
                      onChange({ ...config, backgroundColor: e.target.value })
                    }
                    className="h-10 w-14 rounded cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    {config.backgroundColor || '#f5f5f5'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frame-text-color">Text Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    id="frame-text-color"
                    type="color"
                    value={config.textColor || '#000000'}
                    onChange={(e) =>
                      onChange({ ...config, textColor: e.target.value })
                    }
                    className="h-10 w-14 rounded cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    {config.textColor || '#000000'}
                  </span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="border rounded-lg p-4 bg-muted/30">
                {(config.frameType === 'top' || config.frameType === 'full') && (
                  <div
                    className="p-3 rounded-t-lg text-center font-semibold mb-2"
                    style={{
                      backgroundColor: config.backgroundColor,
                      color: config.textColor,
                    }}
                  >
                    {config.text || 'Scan for Menu'}
                  </div>
                )}
                <div className="bg-muted h-24 rounded flex items-center justify-center text-sm text-muted-foreground">
                  QR Code Preview
                </div>
                {(config.frameType === 'bottom' || config.frameType === 'full') && (
                  <div
                    className="p-3 rounded-b-lg text-center font-semibold mt-2"
                    style={{
                      backgroundColor: config.backgroundColor,
                      color: config.textColor,
                    }}
                  >
                    {config.text || 'Scan for Menu'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
