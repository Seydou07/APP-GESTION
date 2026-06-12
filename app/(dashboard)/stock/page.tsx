"use client"

import { useEffect, useState } from "react"
import { Package, AlertTriangle, TrendingDown, Layers, DollarSign, Truck } from "lucide-react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { TransferStockDialog } from "@/components/products/transfer-dialog"
import { cn } from "@/lib/utils"

export default function StockPage() {
    const { data: session, status } = useSession()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(5)
    const [isTransferOpen, setIsTransferOpen] = useState(false)
    const [productToTransfer, setProductToTransfer] = useState<any>(null)

    const fetchProducts = () => {
        setLoading(true)
        fetch("/api/products")
            .then(res => res.json())
            .then(data => {
                setProducts(data)
                setLoading(false)
            })
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/login")
        }
        if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
            redirect("/")
        }

        fetchProducts()
    }, [status, session])

    if (status === "loading") return null

    const lowStock = products.filter((p: any) => (p.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0) <= p.stockMin)
    const totalValue = products.reduce((acc: number, p: any) => acc + (p.salePrice * (p.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0)), 0)

    const displayedLowStock = lowStock.slice((page - 1) * pageSize, page * pageSize)

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tight">Gestion des Stocks</h2>
                <p className="text-muted-foreground">Suivi des niveaux de stock et alertes de réapprovisionnement.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl shadow-none border border-border bg-indigo-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            Total Produits
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-indigo-900">{products.length}</p>
                        <p className="text-xs text-indigo-600 mt-1">Références enregistrées</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-none border border-border bg-emerald-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Valeur du Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-emerald-900">{totalValue.toLocaleString()} F</p>
                        <p className="text-xs text-emerald-600 mt-1">Estimation totale</p>
                    </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-none border border-border bg-red-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Alertes Actives
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black text-red-900">{lowStock.length}</p>
                        <p className="text-xs text-red-600 mt-1">Produits en rupture</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alertas section - Full Width */}
            <div className="bg-background p-6 rounded-2xl shadow-sm border">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold">Produits en Alerte</h3>
                    </div>
                </div>

                <div className="rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold">Designation</TableHead>
                                <TableHead className="font-bold">Catégorie</TableHead>
                                <TableHead className="text-center font-bold">Stock Boutique</TableHead>
                                <TableHead className="text-center font-bold">Stock Magasin</TableHead>
                                <TableHead className="text-center font-bold">Seuil d'Alerte</TableHead>
                                <TableHead className="text-right font-bold pr-6">Statut & Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">Chargement...</TableCell>
                                </TableRow>
                            ) : lowStock.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">Aucune alerte, tout est en ordre !</TableCell>
                                </TableRow>
                            ) : displayedLowStock.map((p: any) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-bold">{p.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.category?.name || "-"}</TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-bold text-red-600">{p.stockLevels?.find((sl: any) => sl.warehouseId === 1)?.quantity ?? 0}</span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={cn(
                                            "font-bold px-2 py-0.5 rounded-full text-xs",
                                            (p.stockLevels?.find((sl: any) => sl.warehouseId === 2)?.quantity ?? 0) === 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-600"
                                        )}>
                                            {p.stockLevels?.find((sl: any) => sl.warehouseId === 2)?.quantity ?? 0}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                        {p.stockMin}
                                    </TableCell>
                                    <TableCell className="text-right pr-6 flex items-center justify-end gap-2">
                                        {(p.stockLevels?.find((sl: any) => sl.warehouseId === 2)?.quantity ?? 0) > 0 ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setProductToTransfer(p)
                                                    setIsTransferOpen(true)
                                                }}
                                                className="h-8 rounded-xl font-bold border-primary text-primary hover:bg-primary/5 flex items-center gap-1.5 transition-all"
                                            >
                                                <Truck className="w-3.5 h-3.5" />
                                                Transférer
                                            </Button>
                                        ) : (
                                            <Badge variant="destructive" className="font-black uppercase text-[10px]">
                                                Rupture Totale
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {lowStock.length > pageSize && (
                    <div className="mt-6 border-t pt-6">
                        <Pagination
                            total={lowStock.length}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
                            sizes={[5, 10, 20]}
                        />
                    </div>
                )}
            </div>
            <TransferStockDialog
                open={isTransferOpen}
                onOpenChange={setIsTransferOpen}
                onSuccess={fetchProducts}
                product={productToTransfer}
            />
        </div>
    )
}
