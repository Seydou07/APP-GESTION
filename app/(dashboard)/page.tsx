"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export default function DashboardPage() {
    const [recentSales, setRecentSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetch("/api/sales")
            .then(res => res.json())
            .then(data => {
                setRecentSales(data.slice(0, 5))
                setLoading(false)
            })
    }, [])

    return (
        <div className="space-y-8">
            <StatsCards />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <SalesChart />
                </div>

                <div className="bg-background p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-xl font-bold mb-6">Ventes Récentes</h3>
                    <div className="space-y-6">
                        {loading ? (
                            <p className="text-center text-muted-foreground py-10">Chargement...</p>
                        ) : recentSales.length === 0 ? (
                            <p className="text-center text-muted-foreground py-10">Aucune vente récente.</p>
                        ) : recentSales.map((sale: any) => (
                            <div key={sale.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold transition-colors group-hover:bg-primary group-hover:text-white">
                                        {sale.nomClient?.substring(0, 1) || "C"}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{sale.nomClient || "Client Anonyme"}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {mounted && formatDistanceToNow(new Date(sale.date), { addSuffix: true, locale: fr })}
                                        </p>
                                    </div>
                                </div>
                                <p className="font-extrabold text-sm text-primary">+{sale.total.toLocaleString()} F</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
