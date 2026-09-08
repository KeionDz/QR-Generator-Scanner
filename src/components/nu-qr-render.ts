/**
 * The NU Davao QR renderer.
 *
 * A browser port of the server-side renderer in the NU Davao room-booking
 * project (`server/qr.ts`). That one built the code from the QR module matrix
 * directly — `qrcode` gives the matrix, pngjs wrote the pixels — rather than
 * going through a styling library, because the two things that must not be
 * negotiable are the error correction level and the quiet zone, and drawing
 * the modules yourself is the only way to be certain of both. The same holds
 * here; the only difference is that a canvas takes pngjs' place, so preview
 * and download come out of one function and one set of pixels.
 *
 * ── Why the modules are navy on gold, and not gold on navy ──────────────────
 *
 * Gold modules on a navy ground is a REVERSED code: light data on a dark
 * ground, the opposite of what the QR standard specifies. The reference
 * project measured this rather than assuming it — the same payload rendered at
 * thirteen sizes and decoded with jsQR, the very decoder this project's
 * scanner uses. Reversed failed at five of the thirteen sizes with no logo
 * present at all; navy-on-gold and navy-on-white passed every one.
 *
 * A re-run of that harness against THIS renderer's geometry (thirteen sizes,
 * two payloads, jsQR, a stand-in for the shield art) decoded all three styles
 * at every size — so the five-of-thirteen figure above is the reference
 * project's measurement with its own assets, not one reproduced here. It is
 * still the reason the default is navy-on-gold: standard polarity costs
 * nothing, and reversed polarity is rejected outright by some scanner apps.
 *
 * So the brand colours stay and the polarity flips: NU gold is the ground, NU
 * navy is the data, and the navy frame carries the deep-navy look. The
 * reversed treatment is still offered, and flagged in the UI as the risk it is.
 *
 * The rest of the scannability budget:
 *  - Error correction is fixed at level H (~30% recovery). The centred shield
 *    is what spends it, and never grows past LOGO_RATIO.
 *  - The shield covers about 5% of the code's area, far below the ~15% where
 *    readers start to struggle.
 *  - A 4-module quiet zone in the ground colour is kept on every side, as the
 *    standard requires. The navy frame sits OUTSIDE it and never eats into it.
 *  - Navy on gold measures about 9:1 in contrast, well above the 3:1 a scanner
 *    needs to threshold cleanly.
 *  - The caption band is drawn outside the code square entirely, so no amount
 *    of caption text can encroach on the quiet zone.
 */

import QRCode from 'qrcode'

/** The three brand values, taken from the reference project's design tokens. */
export const NU_NAVY = '#262d65' /* Deep Navy */
export const NU_BLUE = '#35408e' /* Primary Blue */
export const NU_GOLD = '#ffd41c' /* Gold */
const WHITE = '#ffffff'

/** Quiet zone in modules. Four is the standard's minimum; it is not tuned down. */
const QUIET_MODULES = 4

/** Decorative navy frame, in modules, drawn outside the quiet zone. */
const FRAME_MODULES = 2

/** Default width of the finished code in pixels, before module rounding. */
const TARGET_PX = 720

/** Shield width as a fraction of the code's width. 0.24 wide is ~5% of the area. */
const LOGO_RATIO = 0.24

/** Where the shield is served from. Copied out of the reference project. */
const SHIELD_SRC = '/nu-shield.png'

export type NuQrStyle = 'navy-on-gold' | 'gold-on-navy' | 'navy-on-white'

interface Palette {
  module: string
  ground: string
  frame: string
}

export const NU_QR_STYLES: Record<NuQrStyle, Palette> = {
  // Default. Standard polarity, both brand colours, navy frame.
  'navy-on-gold': { module: NU_NAVY, ground: NU_GOLD, frame: NU_NAVY },
  // The literal reversed treatment. Kept available; see the note above.
  'gold-on-navy': { module: NU_GOLD, ground: NU_NAVY, frame: NU_GOLD },
  // Plain fallback if a scanner in the field ever struggles with colour at all.
  'navy-on-white': { module: NU_NAVY, ground: WHITE, frame: NU_NAVY },
}

export interface NuQrOptions {
  /** Override the pixel width. A preview wants less than a print sheet. */
  targetPx?: number
  /** Draw the centred NU shield. Off gives a plain code. */
  logo?: boolean
  /** Draw the navy frame. Off when the surrounding card already provides one. */
  frame?: boolean
  /** Palette. Defaults to the measured-safe navy-on-gold. */
  style?: NuQrStyle
  /** Optional caption band, drawn below the code square. */
  caption?: string
}

let shieldPromise: Promise<HTMLImageElement | null> | null = null

/** The shield, decoded once and reused for every render. */
function loadShield(): Promise<HTMLImageElement | null> {
  if (shieldPromise) return shieldPromise
  shieldPromise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      console.warn('[nu-qr] the shield failed to load; rendering without it')
      resolve(null)
    }
    img.src = SHIELD_SRC
  })
  return shieldPromise
}

/** Rounded square path, so the shield plate matches the reference's corners. */
function roundedSquarePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + size - radius, y)
  ctx.quadraticCurveTo(x + size, y, x + size, y + radius)
  ctx.lineTo(x + size, y + size - radius)
  ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size)
  ctx.lineTo(x + radius, y + size)
  ctx.quadraticCurveTo(x, y + size, x, y + size - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Draw the branded code onto `canvas`, resizing it to fit.
 *
 * `text` is whatever the code should carry. Nothing here inspects it — the
 * caller decides what is safe to encode.
 */
export async function renderNuQr(
  canvas: HTMLCanvasElement,
  text: string,
  options: NuQrOptions = {},
): Promise<void> {
  const {
    targetPx = TARGET_PX,
    logo = true,
    frame = true,
    style = 'navy-on-gold',
    caption = '',
  } = options

  const palette = NU_QR_STYLES[style]
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' })
  const count = qr.modules.size
  const grid = qr.modules.data

  const frameModules = frame ? FRAME_MODULES : 0
  const totalModules = count + (QUIET_MODULES + frameModules) * 2
  const scale = Math.max(4, Math.round(targetPx / totalModules))
  const side = totalModules * scale

  const trimmed = caption.trim()
  const captionH = trimmed ? Math.round(side * 0.15) : 0

  canvas.width = side
  canvas.height = side + captionH

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context')

  // Frame first, then the quiet zone painted over it in the ground colour, so
  // the code always has its full four modules of clear space.
  ctx.fillStyle = frame ? palette.frame : palette.ground
  ctx.fillRect(0, 0, side, side)
  const framePx = frameModules * scale
  ctx.fillStyle = palette.ground
  ctx.fillRect(framePx, framePx, side - framePx * 2, side - framePx * 2)

  const offset = (QUIET_MODULES + frameModules) * scale
  ctx.fillStyle = palette.module
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!grid[row * count + col]) continue
      ctx.fillRect(offset + col * scale, offset + row * scale, scale, scale)
    }
  }

  if (logo) {
    const shield = await loadShield()
    if (shield) {
      // Snapped to the module grid, so the plate covers whole modules. A plate
      // that clips modules in half is harder to recover than one that removes
      // them cleanly.
      const plateModules = Math.max(3, Math.round(count * LOGO_RATIO))
      const plate = plateModules * scale
      const plateX = offset + Math.floor((count - plateModules) / 2) * scale

      ctx.save()
      ctx.fillStyle = WHITE
      roundedSquarePath(ctx, plateX, plateX, plate, Math.round(plate * 0.2))
      ctx.fill()
      ctx.restore()

      const pad = Math.max(2, Math.round(plate * 0.09))
      const inner = plate - pad * 2
      // Fit the shield inside the plate without distorting it.
      const ratio = Math.min(inner / shield.width, inner / shield.height)
      const w = shield.width * ratio
      const h = shield.height * ratio
      ctx.drawImage(shield, plateX + pad + (inner - w) / 2, plateX + pad + (inner - h) / 2, w, h)
    }
  }

  if (trimmed) {
    // Band in the frame colour, text in the ground colour. That is always
    // either navy on gold or gold on navy, both of which clear 4.5:1 — the
    // reference project's rule that gold is an accent and never a text colour
    // on white.
    ctx.fillStyle = palette.frame
    ctx.fillRect(0, side, side, captionH)

    ctx.fillStyle = palette.ground
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let fontPx = Math.round(captionH * 0.42)
    const maxWidth = side * 0.86
    do {
      ctx.font = `bold ${fontPx}px 'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif`
      if (ctx.measureText(trimmed).width <= maxWidth) break
      fontPx -= 1
    } while (fontPx > 8)
    ctx.fillText(trimmed, side / 2, side + captionH / 2)
  }
}

/** Save what is on the canvas as a PNG. */
export function downloadNuQr(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not create blob'))
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      resolve()
    }, 'image/png')
  })
}
