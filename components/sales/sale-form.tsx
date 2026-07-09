"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Trash2,
  User,
  Calendar,
  Check,
  Grid,
  List,
  Package,
  Printer,
  Star,
  Clock,
  Pencil
} from "lucide-react"

interface Product {
  id: number
  code: string
  name: string
  salePrice: number
  image?: string
  category?: { name: string }
  stockLevels: { quantity: number }[]
}

interface Category {
  id: number
  name: string
}

interface CartItem {
  productId: number
  name: string
  code?: string
  image?: string
  quantity: number
  priceUnit: number
  discount: number
}

export function SaleForm() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [commission, setCommission] = useState(0)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [saleType, setSaleType] = useState("Comptant")
  const [partialPayment, setPartialPayment] = useState(0)
  const [note, setNote] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(res => res.json()),
      fetch("/api/categories").then(res => res.json()),
      fetch("/api/clients").then(res => res.json())
    ]).then(([productsData, categoriesData, clientsData]) => {
      setProducts(productsData)
      setCategories(categoriesData)
      setClients(clientsData)
      if (clientsData.length > 0) {
        setSelectedClient(clientsData[0])
      }
    })
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || 
                           product.category?.name === selectedCategory ||
                           product.category?.id === Number(selectedCategory)
    return matchesSearch && matchesCategory
  })

  const subtotal = cart.reduce((sum, item) => sum + (item.priceUnit * item.quantity), 0)
  const total = subtotal - globalDiscount + commission
  const remaining = saleType === "Crédit" ? (total - partialPayment) : 0

  const addToCart = (product: Product) => {
    const stock = product.stockLevels?.[0]?.quantity ?? 0
    const existingItem = cart.find(item => item.productId === product.id)
    
    if (existingItem) {
      if (existingItem.quantity + 1 > stock) {
        toast.error("Stock insuffisant")
        return
      }
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ))
    } else {
      if (stock < 1) {
        toast.error("Stock insuffisant")
        return
      }
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        code: product.code,
        image: product.image,
        quantity: 1,
        priceUnit: product.salePrice,
        discount: 0
      }])
    }
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return
    const item = cart[index]
    const product = products.find(p => p.id === item.productId)
    const stock = product?.stockLevels?.[0]?.quantity ?? 0
    
    if (newQty > stock) {
      toast.error("Stock insuffisant")
      return
    }
    setCart(cart.map((item, i) => i === index ? { ...item, quantity: newQty } : item))
  }

  const resetForm = () => {
    setCart([])
    setGlobalDiscount(0)
    setCommission(0)
    setPartialPayment(0)
    setSaleType("Comptant")
    if (clients.length > 0) {
      setSelectedClient(clients[0])
    }
    setSearchTerm("")
    setSelectedCategory("all")
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error("Le panier est vide")
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            designation: item.name,
            priceUnit: item.priceUnit,
            discount: item.discount
          })),
          remise: globalDiscount,
          commission,
          paymentMethod: "ESPECES",
          clientId: selectedClient?.id || null
        })
      })
      
      if (!res.ok) throw new Error("Erreur serveur")
      
      toast.success("Vente enregistrée avec succès !")
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de la vente")
    } finally {
      setLoading(false)
    }
  }

  const handleCreditSale = async () => {
    if (cart.length === 0) {
      toast.error("Le panier est vide")
      return
    }
    
    if (!selectedClient) {
      toast.error("Sélectionnez un client pour le crédit")
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            designation: item.name,
            priceUnit: item.priceUnit,
            discount: item.discount
          })),
          clientId: selectedClient.id,
          total,
          paidAmount: partialPayment,
          notes: note || undefined
        })
      })
      
      if (!res.ok) throw new Error("Erreur serveur")
      
      toast.success("Vente à crédit enregistrée avec succès !")
      resetForm()
    } catch (error) {
      toast.error("Erreur lors de la vente à crédit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex gap-4">
      {/* Left Column - Products */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="h-9 px-4 text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 rounded-none">
            <Package className="w-4 h-4 mr-2" />
            Produits
          </Button>
          <Button variant="ghost" className="h-9 px-4 text-sm font-medium text-gray-500 rounded-none">
            <Star className="w-4 h-4 mr-2" />
            Favoris
          </Button>
          <Button variant="ghost" className="h-9 px-4 text-sm font-medium text-gray-500 rounded-none">
            <Clock className="w-4 h-4 mr-2" />
            Historique
          </Button>
        </div>

        {/* Products Grid */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-xs"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder="Catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-9 text-xs">
              Marques
            </Button>
            <Button variant="outline" className="h-9 text-xs">
              <Filter className="w-4 h-4 mr-1.5" />
              Filtres
            </Button>
            <div className="ml-auto flex items-center gap-1 border rounded-lg p-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 bg-purple-600 text-white">
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map(product => {
              const stock = product.stockLevels?.[0]?.quantity ?? 0
              return (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:border-purple-300 transition-all overflow-hidden border"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-3 flex flex-col h-full">
                    <div className="w-full h-24 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      <div className="text-orange-300 font-bold text-5xl">
                        {product.name.charAt(0)}
                      </div>
                    </div>
                    <p className="text-xs font-semibold line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-[10px] text-gray-500 mb-2">REF: {product.code}</p>
                    <div className="mt-auto space-y-1">
                      <p className="text-sm font-bold text-gray-900">{product.salePrice.toLocaleString()} FCFA</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${stock <= 0 ? 'bg-red-50 text-red-600' : stock <= 10 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${stock <= 0 ? 'bg-red-600' : stock <= 10 ? 'bg-orange-600' : 'bg-green-600'}`} />
                          En stock: {stock}
                        </span>
                        <Button 
                          size="sm" 
                          className="h-7 w-7 p-0 rounded-full bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Column - Cart & Totals */}
      <div className="w-[420px] flex flex-col gap-4">
        {/* Cart */}
        <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-purple-600" />
              </div>
              Panier de vente
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} articles
              </span>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={resetForm} className="text-red-500 hover:bg-red-50 h-7 text-xs font-medium">
                  Vider
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
            {cart.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Aucun article dans le panier</p>
              </div>
            ) : (
              cart.map((item, index) => {
                const itemSubtotal = (item.priceUnit * item.quantity)
                return (
                  <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <div className="text-orange-300 font-bold text-xl">
                        {item.name.charAt(0)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-500">REF: {item.code}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-orange-500 hover:bg-orange-50"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-lg bg-white">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)} 
                            className="w-9 h-7 border-0 text-center text-[10px] font-semibold p-0"
                            min={1}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500">
                            {item.priceUnit.toLocaleString()} <span className="text-gray-400">FCFA</span>
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {itemSubtotal.toLocaleString()} <span className="text-xs font-medium text-gray-400">FCFA</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            {/* Note */}
            <div className="mt-2">
              <Label className="text-[10px] text-gray-500 mb-1 block">Ajouter une note (optionnel)</Label>
              <div className="relative">
                <Input 
                  placeholder="Ex: Livraison demain matin..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-9 text-xs pr-10 bg-gray-50 border-gray-200"
                />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7 text-gray-400">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sale Info & Totals */}
        <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
          {/* Client & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                Client
              </Label>
              <Select value={selectedClient?.id?.toString() || ""} onValueChange={(value) => {
                const client = clients.find(c => c.id.toString() === value)
                setSelectedClient(client || null)
              }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-500 flex items-center gap-1">
                Type de vente
              </Label>
              <Select value={saleType} onValueChange={setSaleType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comptant">Comptant</SelectItem>
                  <SelectItem value="Crédit">Crédit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Credit Info */}
          {saleType === "Crédit" && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-2">
              <Label className="text-[10px] text-purple-700 font-semibold">Conditions de paiement</Label>
              <div className="space-y-1">
                <Label className="text-[10px] text-gray-500">Acompte / Paiement partiel</Label>
                <Input 
                  type="number" 
                  value={partialPayment} 
                  onChange={(e) => setPartialPayment(Math.max(0, Number(e.target.value) || 0))}
                  className="h-8 text-xs bg-white"
                  min={0}
                />
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-dashed border-purple-200">
                <Label className="text-[10px] text-gray-500">Reste à payer</Label>
                <span className="text-sm font-bold text-purple-700">{remaining.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Sous-total</span>
              <span className="text-sm font-semibold text-gray-900">{subtotal.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                Remise
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-green-600">-</span>
                <Input 
                  type="number" 
                  value={globalDiscount} 
                  onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 h-8 text-xs bg-white text-right"
                  min={0}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-orange-500 flex items-center gap-1.5">
                Commission
                <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-orange-500">+</span>
                <Input 
                  type="number" 
                  value={commission} 
                  onChange={(e) => setCommission(Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 h-8 text-xs bg-white text-right"
                  min={0}
                />
              </div>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Total à payer</span>
              <span className="text-2xl font-black text-purple-600">{total.toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {saleType === "Comptant" ? (
              <Button 
                className="w-full h-12 font-bold text-sm shadow-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                disabled={loading || cart.length === 0}
                onClick={handleCompleteSale}
              >
                <div className="w-5 h-5 mr-2 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                Enregistrer la vente
              </Button>
            ) : (
              <Button 
                className="w-full h-12 font-bold text-sm shadow-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                disabled={loading || cart.length === 0 || !selectedClient}
                onClick={handleCreditSale}
              >
                <div className="w-5 h-5 mr-2 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
                Enregistrer la vente à crédit
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-10 font-medium text-sm border-2 border-gray-200"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
              <Button 
                variant="ghost" 
                className="h-10 font-medium text-sm border-2 border-dashed border-gray-200"
                onClick={resetForm}
              >
                Nouveau
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
