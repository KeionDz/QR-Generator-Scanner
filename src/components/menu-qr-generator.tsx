"use client"

import React, { useState, useMemo } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { useToast } from "../hooks/use-toast"
import { QRCodeSVG } from "qrcode.react"
import { UtensilsCrossed, Download, Copy, Plus, Trash2, Sparkles, Palette } from "lucide-react"
import { QRCTAFrame } from "./qr-cta-frame"
import { downloadQRCodeWithBranding } from "./qr-download-util"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
}

interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface MenuConfig {
  restaurantName: string
  restaurantUrl: string
  categories: MenuCategory[]
}

export function MenuQRGenerator() {
  const { toast } = useToast()
  const qrRef = React.useRef<SVGSVGElement>(null)

  const [menuConfig, setMenuConfig] = useState<MenuConfig>({
    restaurantName: "My Restaurant",
    restaurantUrl: "",
    categories: [
      {
        id: "1",
        name: "Appetizers",
        items: [
          { id: "1-1", name: "Spring Rolls", description: "Fresh vegetable spring rolls", price: 6.99, category: "1" },
          { id: "1-2", name: "Dumplings", description: "Pan-fried pork dumplings", price: 5.99, category: "1" },
        ],
      },
      {
        id: "2",
        name: "Main Courses",
        items: [
          { id: "2-1", name: "Pad Thai", description: "Stir-fried rice noodles", price: 12.99, category: "2" },
          { id: "2-2", name: "Green Curry", description: "Creamy green curry with chicken", price: 14.99, category: "2" },
        ],
      },
    ],
  })

  const [patternColor, setPatternColor] = useState("#000000")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [ctaConfig, setCtaConfig] = useState({
    enabled: false,
    text: "Scan for Menu",
    frameType: "top" as const,
    backgroundColor: "#f5f5f5",
    textColor: "#000000",
  })

  const menuString = useMemo(() => {
    const menuData = {
      restaurant: menuConfig.restaurantName,
      url: menuConfig.restaurantUrl,
      categories: menuConfig.categories.map((cat) => ({
        name: cat.name,
        items: cat.items.map((item) => ({
          name: item.name,
          description: item.description,
          price: item.price,
        })),
      })),
    }

    const encoded = encodeURIComponent(JSON.stringify(menuData))
    return `https://menu.example.com/?data=${encoded}`
  }, [menuConfig])

  const addCategory = () => {
    const newCategory: MenuCategory = {
      id: Date.now().toString(),
      name: `Category ${menuConfig.categories.length + 1}`,
      items: [],
    }
    setMenuConfig((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory],
    }))
  }

  const deleteCategory = (categoryId: string) => {
    setMenuConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat.id !== categoryId),
    }))
    toast({
      title: "Category Deleted",
      description: "Category has been removed from the menu",
    })
  }

  const addMenuItem = (categoryId: string) => {
    setMenuConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: [
                ...cat.items,
                {
                  id: `${categoryId}-${Date.now()}`,
                  name: "New Item",
                  description: "Add description",
                  price: 0,
                  category: categoryId,
                },
              ],
            }
          : cat
      ),
    }))
  }

  const updateMenuItem = (categoryId: string, itemId: string, field: keyof MenuItem, value: any) => {
    setMenuConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : cat
      ),
    }))
  }

  const deleteMenuItem = (categoryId: string, itemId: string) => {
    setMenuConfig((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, items: cat.items.filter((item) => item.id !== itemId) } : cat
      ),
    }))
  }

  const generateSample = () => {
    toast({
      title: "Sample Menu Loaded",
      description: "Restaurant sample menu has been populated",
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Menu Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Restaurant Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Restaurant Information
              </CardTitle>
              <CardDescription>Configure your restaurant and menu details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="menu-restaurant">Restaurant Name</Label>
                <Input
                  id="menu-restaurant"
                  placeholder="Enter restaurant name"
                  value={menuConfig.restaurantName}
                  onChange={(e) =>
                    setMenuConfig((prev) => ({ ...prev, restaurantName: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu-url">Menu URL (Optional)</Label>
                <Input
                  id="menu-url"
                  placeholder="https://yourmenu.com"
                  type="url"
                  value={menuConfig.restaurantUrl}
                  onChange={(e) =>
                    setMenuConfig((prev) => ({ ...prev, restaurantUrl: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Categories & Items */}
          <div className="space-y-4">
            {menuConfig.categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Input
                        placeholder="Category name"
                        value={category.name}
                        onChange={(e) =>
                          setMenuConfig((prev) => ({
                            ...prev,
                            categories: prev.categories.map((cat) =>
                              cat.id === category.id ? { ...cat, name: e.target.value } : cat
                            ),
                          }))
                        }
                        className="text-lg font-semibold"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCategory(category.id)}
                      className="ml-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No items yet</p>
                  ) : (
                    category.items.map((item) => (
                      <div key={item.id} className="space-y-2 p-4 border rounded-lg">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Item Name</Label>
                            <Input
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) =>
                                updateMenuItem(category.id, item.id, "name", e.target.value)
                              }
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Price</Label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">$</span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) =>
                                  updateMenuItem(category.id, item.id, "price", parseFloat(e.target.value))
                                }
                                className="text-sm flex-1"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) =>
                              updateMenuItem(category.id, item.id, "description", e.target.value)
                            }
                            className="text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMenuItem(category.id, item.id)}
                          className="w-full text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Item
                        </Button>
                      </div>
                    ))
                  )}

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => addMenuItem(category.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={addCategory} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>

          <Button onClick={generateSample} variant="outline" className="w-full bg-transparent">
            <Sparkles className="h-4 w-4 mr-2" />
            Load Sample Menu
          </Button>
        </div>

        {/* QR Preview */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code Preview</CardTitle>
            <CardDescription>Menu QR Code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {menuString && (
              <>
                <div className="flex justify-center p-4 bg-muted/30 rounded-lg relative">
                  <div style={{ backgroundColor }}>
                    <QRCodeSVG
                      ref={qrRef}
                      value={menuString}
                      size={180}
                      level="M"
                      includeMargin
                      fgColor={patternColor}
                      bgColor={backgroundColor}
                      className="border rounded"
                    />
                  </div>
                  {logoUrl && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-lg p-1 flex items-center justify-center shadow-lg">
                      <img src={logoUrl || "/placeholder.svg"} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        await downloadQRCodeWithBranding({
                          value: menuString,
                          filename: `menu-${menuConfig.restaurantName.replace(/\s/g, "-")}`,
                          patternColor,
                          backgroundColor,
                          logoUrl,
                          ctaConfig,
                        })
                      } catch (error) {
                        console.error("[v0] Download error:", error)
                      }
                    }}
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(menuString)
                        toast({
                          title: "Copied",
                          description: "Menu QR code URL copied to clipboard",
                        })
                      } catch (error) {
                        console.error("[v0] Copy error:", error)
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>

                {/* Brand Customization */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">Branding</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menu-pattern-color" className="text-xs">
                      Pattern Color
                    </Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="menu-pattern-color"
                        type="color"
                        value={patternColor}
                        onChange={(e) => setPatternColor(e.target.value)}
                        className="h-8 w-10 rounded cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{patternColor}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menu-bg-color" className="text-xs">
                      Background Color
                    </Label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="menu-bg-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-8 w-10 rounded cursor-pointer"
                      />
                      <span className="text-xs text-muted-foreground">{backgroundColor}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menu-logo" className="text-xs">
                      Logo
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent flex-1"
                        onClick={() => {
                          const input = document.createElement("input")
                          input.type = "file"
                          input.accept = "image/*"
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                setLogoUrl(event.target?.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }
                          input.click()
                        }}
                      >
                        Upload
                      </Button>
                      {logoUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent flex-1"
                          onClick={() => setLogoUrl("")}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA Frame */}
                <div className="pt-4 border-t">
                  <QRCTAFrame config={ctaConfig} onChange={()=>setCtaConfig} />
                </div>

                <Badge variant="secondary" className="w-full justify-center">
                  {menuConfig.categories.length} Categories
                </Badge>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
