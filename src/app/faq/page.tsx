import { Header } from "../../components/header"
import { Footer } from "../../components/footer"
import { ThemeProvider } from "../../components/theme-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion"
import { Badge } from "../../components/ui/badge"
import { HelpCircle, Shield, Smartphone, Wifi } from "lucide-react"

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I use the generated QR code?",
      answer:
        "Simply open your phone's camera app and point it at the QR code. Most modern smartphones will automatically detect the Wi-Fi network and prompt you to connect. No additional apps are needed.",
    },
    {
      question: "Is my Wi-Fi password safe?",
      answer:
        "All QR code generation happens locally in your browser. Your Wi-Fi credentials are never sent to our servers or stored anywhere. The processing is completely client-side for maximum privacy.",
    },
    {
      question: "What devices can scan these QR codes?",
      answer:
        "Any device with a camera and QR code scanning capability can use these codes. This includes iPhones (iOS 11+), Android phones (Android 10+), tablets, and dedicated QR code scanner apps.",
    },
    {
      question: "Can I use this for business networks?",
      answer:
        "Yes! This tool is perfect for businesses like cafes, restaurants, hotels, and offices. You can generate QR codes for guest networks and display them for easy customer access.",
    },
    {
      question: "What Wi-Fi security types are supported?",
      answer:
        "We support all common Wi-Fi security types: WPA/WPA2 (most common), WEP (older networks), and open networks (no password). The tool automatically formats the QR code correctly for each type.",
    },
    {
      question: "Why isn't my QR code working?",
      answer:
        "Make sure you've entered the correct network name (SSID) and password. Check that the security type matches your network. Also ensure the QR code is clear and well-lit when scanning.",
    },
    {
      question: "Can I print the QR codes?",
      answer:
        "Yes! Download the QR code as a high-resolution PNG file that's perfect for printing. Make sure to print it large enough to be easily scannable - at least 2x2 inches is recommended.",
    },
    {
      question: "Do you store any of my information?",
      answer:
        "No, we don't store any information. This website doesn't use cookies for tracking, doesn't require registration, and processes everything locally in your browser. Your privacy is completely protected.",
    },
    {
      question: "Is this service free?",
      answer:
        "Yes, completely free! There are no hidden costs, premium features, or usage limits. Generate as many Wi-Fi QR codes as you need without any restrictions.",
    },
    {
      question: "What if I have a hidden network?",
      answer:
        "No problem! Check the 'Hidden network' option when generating your QR code. Devices scanning the code will still be able to connect to your hidden network automatically.",
    },
  ]

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="text-center mb-12">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
                <HelpCircle className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-balance mb-4">Frequently Asked Questions</h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
                Everything you need to know about generating and using Wi-Fi QR codes.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Common Questions</CardTitle>
                    <CardDescription>
                      Find answers to the most frequently asked questions about our Wi-Fi QR generator.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Privacy Guaranteed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="secondary" className="w-fit">
                      100% Local
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Your Wi-Fi credentials never leave your device. All processing happens locally in your browser.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Universal Compatibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="secondary" className="w-fit">
                      All Devices
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Works with iPhone, Android, and any device with a camera and QR scanner.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      Quick Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="secondary" className="w-fit">
                      Instant
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Generate QR codes in seconds. No registration or downloads required.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-12">
              <Card>
                <CardHeader>
                  <CardTitle>Still Have Questions?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you can't find the answer you're looking for, here are some additional resources:
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold mb-2">Troubleshooting Tips</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Ensure good lighting when scanning</li>
                        <li>• Hold camera steady and at proper distance</li>
                        <li>• Verify network name and password are correct</li>
                        <li>• Check that your device supports QR Wi-Fi codes</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold mb-2">Best Practices</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Print QR codes at least 2x2 inches</li>
                        <li>• Use high contrast for better scanning</li>
                        <li>• Test the QR code before sharing</li>
                        <li>• Keep backup of your Wi-Fi credentials</li>
                      </ul>
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
