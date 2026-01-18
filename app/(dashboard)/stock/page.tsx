"use client"

import { useEffect, useState } from "react"
import { Package, AlertTriangle } from "lucide-react"

export default function StockPage() {
    const [products, setProducts] = useState([])

    useEffect(() => {
        fetch("/api/products")
            .then(res => res.json())
            .then(setProducts)
    }, [])

    const lowStock = products.filter((p: any) => p.quantite <= p.seuilAlerte)

    return (
        <div className="space-y-8">
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold">Gestion des Stocks</h2>
                <p className="text-muted-foreground">Suivi des niveaux de stock et alertes de réapprovisionnement.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-background p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center gap-4 mb-4">
                        <AlertTriangle className="text-red-500 w-6 h-6" />
                        <h3 className="font-bold text-lg">Alertes de Stock</h3>
                    </div>
                    <div className="space-y-4">
                        {lowStock.length === 0 ? (
                            <p className="text-sm text-center py-4 text-muted-foreground">Tout est en ordre !</p>
                        ) : lowStock.map((p: any) => (
                            <div key={p.id} className="flex justify-between items-center bg-red-50 p-4 rounded-xl">
                                <div>
                                    <p className="font-bold text-sm">{p.designation}</p>
                                    <p className="text-xs text-red-600">Restant: {p.quantite}</p>
                                </div>
                                <div className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-bold uppercase">
                                    Critique
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-background p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4 mb-4 text-primary">
                        <Package className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Statistiques de Stock</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="flex justify-between border-b pb-4">
                            <span className="text-muted-foreground">Total produits:</span>
                            <span className="font-bold">{products.length}</span>
                        </div>
                        <div className="flex justify-between border-b pb-4">
                            <span className="text-muted-foreground">Valeur totale stock:</span>
                            <span className="font-bold text-primary">
                                {products.reduce((acc: number, p: any) => acc + (p.prixUnitaire * p.quantite), 0).toLocaleString()} F
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
