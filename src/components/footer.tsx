import Link from "next/link"
import { Wifi, Github, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Wifi className="h-4 w-4 text-primary" />
              </div>
              Wi-Fi QR Generator
            </Link>
            <p className="text-sm text-muted-foreground">
              Generate secure QR codes for your Wi-Fi networks. Simple, fast, and privacy-focused.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Tools</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  QR Generator
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Privacy</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted-foreground">All processing happens locally in your browser</li>
              <li className="text-muted-foreground">No data is sent to our servers</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Wi-Fi QR Generator. Built with <Heart className="inline h-3 w-3 text-red-500" /> for easy network
            sharing.
          </p>
          <div className="flex items-center gap-4">
            <Link href="https://github.com" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
