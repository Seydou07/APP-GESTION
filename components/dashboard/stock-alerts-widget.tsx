"use client"

import { AlertTriangle, Package, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface StockAlert {
    id: number
    designation: string
    quantite: number
    seuilAlerte: number
    categorie?: string | null
}

interface StockAlertsWidgetProps {
    data?: StockAlert[]
    loading?: boolean
}

export function StockAlertsWidget({ data, loading }: StockAlertsWidgetProps) {
    if (loading || !data) {
        return (
            <div className="bg-background p-6 rounded-2xl shadow-sm border animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-muted rounded-xl" />
                    <div className="h-5 w-40 bg-muted rounded" />
                </div>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="mb-4 space-y-2">
                        <div className="h-3 w-3/4 bg-muted rounded" />
                        <div className="h-2 w-full bg-muted rounded-full" />
                    </div>
                ))}
            </div>
        )
    }

    if (!data.length) {
        return (
            <div className="bg-background p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <p className="font-black text-sm">Stock en bonne santé</p>
                    <p className="text-xs text-muted-foreground mt-1">Aucun produit sous le seuil d'alerte</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-background p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-black leading-tight">Alertes Stock</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Produits sous seuil</p>
                    </div>
                </div>
                <Badge variant="destructive" className="font-black text-xs rounded-lg px-2.5">
                    {data.length}
                </Badge>
            </div>

            <div className="space-y-4">
                {data.map((product) => {
                    const ratio = product.seuilAlerte > 0 ? product.quantite / product.seuilAlerte : 0
                    const pct = Math.min(ratio * 100, 100)
                    const isEmpty = product.quantite === 0
                    const isCritical = pct <= 30

                    return (
                        <div key={product.id} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Package className={cn(
                                        "w-3.5 h-3.5 shrink-0",
                                        isEmpty ? "text-red-500" : isCritical ? "text-orange-500" : "text-amber-500"
                                    )} />
                                    <span className="text-sm font-semibold truncate max-w-[160px]" title={product.designation}>
                                        {product.designation}
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-xs font-black tabular-nums shrink-0 ml-2",
                                    isEmpty ? "text-red-600" : isCritical ? "text-orange-600" : "text-amber-600"
                                )}>
                                    {product.quantite}/{product.seuilAlerte}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        isEmpty ? "bg-red-500" : isCritical ? "bg-orange-400" : "bg-amber-400"
                                    )}
                                    style={{ width: isEmpty ? "4px" : `${pct}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
