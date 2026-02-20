"use client"

import { useEffect, useState } from "react"
import { Package, AlertTriangle, TrendingDown, Layers, DollarSign } from "lucide-react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function StockPage() {
    const { data: session, status } = useSession()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/login")
        }
        if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
            redirect("/")
        }

        setLoading(true)
        fetch("/api/products")
            .then(res => res.json())
            .then(data => {
                setProducts(data)
                setLoading(false)
            })
    }, [status, session])

    if (status === "loading") return null

    const lowStock = products.filter((p: any) => p.quantite <= p.seuilAlerte)
    const totalValue = products.reduce((acc: number, p: any) => acc + (p.prixUnitaire * p.quantite), 0)

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col">
                <h2 className="text-3xl font-black tracking-tight">Gestion des Stocks</h2>
                <p className="text-muted-foreground">Suivi des niveaux de stock et alertes de réapprovisionnement.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl shadow-sm border-none bg-indigo-50/50">
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

                <Card className="rounded-2xl shadow-sm border-none bg-emerald-50/50">
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

                <Card className="rounded-2xl shadow-sm border-none bg-red-50/50">
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
                                <TableHead className="text-center font-bold">Stock Actuel</TableHead>
                                <TableHead className="text-center font-bold">Seuil d'Alerte</TableHead>
                                <TableHead className="text-right font-bold pr-6">Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">Chargement...</TableCell>
                                </TableRow>
                            ) : lowStock.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">Aucune alerte, tout est en ordre !</TableCell>
                                </TableRow>
                            ) : lowStock.map((p: any) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-bold">{p.designation}</TableCell>
                                    <TableCell className="text-muted-foreground">{p.categorie || "-"}</TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-bold text-red-600">{p.quantite}</span>
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground">
                                        {p.seuilAlerte}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Badge variant="destructive" className="font-black uppercase text-[10px]">
                                            Réapprovisionner
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
