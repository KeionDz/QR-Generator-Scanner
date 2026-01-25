import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { LoadingScreen } from "../components/loading-screen"
import "./globals.css"

export const metadata: Metadata = {
  title: "KDMZ QR Generator - Wi-Fi & Product QR Codes",
  description:
    "Generate QR codes for Wi-Fi networks and products. Share Wi-Fi credentials securely or manage product supply chains with GS1 Digital Link format.",
  generator: "v0.app",
  keywords: "wifi, qr code, generator, network, sharing, wireless, product, barcode, supply chain",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
