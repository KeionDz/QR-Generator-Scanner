import { Header } from "../../components/header"
import { Footer } from "../../components/footer"
import { ThemeProvider } from "../../components/theme-provider"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Wifi, Shield, Heart, Code, Users, Lightbulb, Package } from "lucide-react"

export default function AboutPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="text-center mb-12">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
                <Wifi className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-balance mb-4">About KDMZ QR Generator</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Making Wi-Fi sharing and product tracking simple, secure, and accessible for everyone.
              </p>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    We believe that sharing your Wi-Fi network with guests, customers, or friends should be effortless
                    and secure. KDMZ QR Generator eliminates the hassle of typing complex passwords and enables
                    enterprise-grade product tracking. Whether you need Wi-Fi sharing or supply chain management, our
                    solution covers both with privacy as the foundation.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Built with privacy as our top priority, all QR code generation happens locally in your browser. Your
                    credentials never leave your device, giving you complete control over sensitive information.
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Local Processing</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      All QR code generation happens entirely in your browser. We don't store, transmit, or have access
                      to your Wi-Fi credentials.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• No server-side processing</li>
                      <li>• No data collection</li>
                      <li>• No tracking cookies</li>
                      <li>• Open source code</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Technology
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Modern Web</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Built with modern web technologies for optimal performance, security, and user experience.
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• React & TypeScript</li>
                      <li>• Client-side QR generation</li>
                      <li>• Responsive design</li>
                      <li>• Progressive Web App ready</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Perfect For
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold mb-2">Wi-Fi Sharing</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Home users sharing with guests</p>
                        <p>• Cafes and restaurants</p>
                        <p>• Hotels and offices</p>
                        <p>• Events and conferences</p>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold mb-2">Product Tracking</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Inventory management</p>
                        <p>• Supply chain logistics</p>
                        <p>• Product authentication</p>
                        <p>• Retail and distribution</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Built with Care
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    KDMZ QR Generator was created to solve real-world problems: sharing Wi-Fi credentials securely and
                    managing products through supply chains efficiently. We're committed to keeping it free, private,
                    and continuously improving based on user feedback.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Wi-Fi QR:</strong> QR codes can store up to 4,296 alphanumeric characters, perfect for
                        secure network sharing on any device.
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Product QR:</strong> GS1 Digital Link format enables seamless integration with modern
                        supply chain systems and retail operations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  )
}
