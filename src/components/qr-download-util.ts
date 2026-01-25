import QRCode from "qrcode"

export interface QRDownloadOptions {
  value: string
  filename: string
  patternColor?: string
  backgroundColor?: string
  logoUrl?: string
  ctaConfig?: {
    enabled: boolean
    text: string
    frameType: 'top' | 'bottom' | 'both'
    backgroundColor: string
    textColor: string
  }
}

export async function downloadQRCodeWithBranding(options: QRDownloadOptions) {
  try {
    const {
      value,
      filename,
      patternColor = '#000000',
      backgroundColor = '#ffffff',
      logoUrl,
      ctaConfig,
    } = options

    // Generate QR code as canvas
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, value, {
      width: 300,
      margin: 2,
      color: {
        dark: patternColor,
        light: backgroundColor,
      },
      errorCorrectionLevel: 'H',
    })

    // Create final canvas with padding for CTA frames
    const finalWidth = canvas.width
    const ctaHeight = ctaConfig?.enabled ? 80 : 0
    const totalHeight = ctaConfig?.frameType === 'both' ? canvas.height + ctaHeight * 2 : canvas.height + ctaHeight

    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = finalWidth
    finalCanvas.height = totalHeight
    const ctx = finalCanvas.getContext('2d')

    if (!ctx) throw new Error('Could not get canvas context')

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, finalWidth, totalHeight)

    // Draw top CTA frame
    if (ctaConfig?.enabled && (ctaConfig.frameType === 'top' || ctaConfig.frameType === 'both')) {
      ctx.fillStyle = ctaConfig.backgroundColor
      ctx.fillRect(0, 0, finalWidth, ctaHeight)
      ctx.fillStyle = ctaConfig.textColor
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ctaConfig.text, finalWidth / 2, ctaHeight / 2)
    }

    // Draw QR code
    const yOffset = ctaConfig?.enabled && (ctaConfig.frameType === 'top' || ctaConfig.frameType === 'both') ? ctaHeight : 0
    ctx.drawImage(canvas, 0, yOffset)

    // Draw bottom CTA frame
    if (ctaConfig?.enabled && (ctaConfig.frameType === 'bottom' || ctaConfig.frameType === 'both')) {
      const bottomY = yOffset + canvas.height
      ctx.fillStyle = ctaConfig.backgroundColor
      ctx.fillRect(0, bottomY, finalWidth, ctaHeight)
      ctx.fillStyle = ctaConfig.textColor
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ctaConfig.text, finalWidth / 2, bottomY + ctaHeight / 2)
    }

    // Draw logo in center if provided
    if (logoUrl) {
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        logo.onload = resolve
        logo.onerror = reject
        logo.src = logoUrl
      })

      const logoSize = 60
      const logoX = (finalWidth - logoSize) / 2
      const logoY = (canvas.height - logoSize) / 2 + yOffset

      // Draw white background for logo
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 3, 0, Math.PI * 2)
      ctx.fill()

      // Draw logo
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)
    }

    // Download the final canvas
    finalCanvas.toBlob((blob) => {
      if (!blob) throw new Error('Could not create blob')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png')
  } catch (error) {
    console.error('[v0] QR Download Error:', error)
    throw error
  }
}
