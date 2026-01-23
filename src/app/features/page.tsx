import { Header } from "../../components/header"
import { Footer } from "../../components/footer"
import { ThemeProvider } from "../../components/theme-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Shield, Smartphone, Download, Copy, Zap, Globe, Lock, Users } from "lucide-react"

export default function FeaturesPage() {
  const features = [
    {
      icon: Shield,
      title: "Privacy First",
      description:
        "All QR code generation happens locally in your browser. Your Wi-Fi credentials never leave your device.",
      badge: "Secure",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description:
        "Responsive design that works perfectly on phones, tablets, and desktops. Generate QR codes anywhere.",
      badge: "Responsive",
    },
    {
      icon: Download,
      title: "High-Quality Export",
      description: "Download your QR codes as high-resolution PNG files, perfect for printing or sharing digitally.",
      badge: "HD Quality",
    },
    {
      icon: Copy,
      title: "Easy Sharing",
      description: "Copy the Wi-Fi configuration string to clipboard for use in other applications or manual setup.",
      badge: "Convenient",
    },
    {
      icon: Zap,
      title: "Instant Generation",
      description: "Real-time QR code generation as you type. See your changes immediately without waiting.",
      badge: "Fast",
    },
    {
      icon: Globe,
      title: "Universal Compatibility",
      description: "Works with all modern devices and QR code scanners. Supports WPA, WEP, and open networks.",
      badge: "Compatible",
    },
    {
      icon: Lock,
      title: "Security Options",
      description: "Support for all Wi-Fi security types including WPA/WPA2, WEP, and open networks.",
      badge: "Flexible",
    },
    {
      icon: Users,
      title: "Guest Access",
      description: "Perfect for sharing Wi-Fi with guests, customers, or visitors without revealing your password.",
      badge: "Social",
    },
  ]

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-balance mb-4">Powerful Features</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Everything you need to generate and share Wi-Fi QR codes securely and efficiently.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-2xl">Why Choose Our Generator?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-left">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold mb-2">No Registration Required</h3>
                      <p className="text-sm text-muted-foreground">
                        Start generating QR codes immediately without creating an account or providing personal
                        information.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Always Free</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate unlimited Wi-Fi QR codes at no cost. No hidden fees or premium features.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Open Source</h3>
                      <p className="text-sm text-muted-foreground">
                        Built with transparency in mind. You can verify our privacy claims and contribute improvements.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Regular Updates</h3>
                      <p className="text-sm text-muted-foreground">
                        Continuously improved with new features and security enhancements based on user feedback.
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
