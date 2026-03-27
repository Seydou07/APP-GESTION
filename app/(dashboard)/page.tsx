"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { TopProductsChart } from "@/components/dashboard/top-products-chart"
import { StockAlertsWidget } from "@/components/dashboard/stock-alerts-widget"
import { HourlySalesChart } from "@/components/dashboard/hourly-sales-chart"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export default function DashboardPage() {
    const [recentSales, setRecentSales] = useState([])
    const [stats, setStats] = useState([])
    const [chartData, setChartData] = useState([])
    const [loadingSales, setLoadingSales] = useState(true)
    const [loadingStats, setLoadingStats] = useState(true)
    const [loadingCharts, setLoadingCharts] = useState(true)
    const [mounted, setMounted] = useState(false)

    const [topProducts, setTopProducts] = useState([])
    const [stockAlerts, setStockAlerts] = useState([])
    const [hourlySales, setHourlySales] = useState([])
    const [debtSummary, setDebtSummary] = useState<any>(null)

    useEffect(() => {
        setMounted(true)

        // Fetch stats
        fetch("/api/dashboard/stats")
            .then(res => res.json())
            .then(data => {
                setStats(data.stats)
                setChartData(data.chartData)
                setLoadingStats(false)
            })

        // Fetch recent sales
        fetch("/api/sales")
            .then(res => res.json())
            .then(data => {
                setRecentSales(data.slice(0, 5))
                setLoadingSales(false)
            })

        // Fetch chart widgets data
        fetch("/api/dashboard/charts")
            .then(res => res.json())
            .then(data => {
                setTopProducts(data.topProducts || [])
                setStockAlerts(data.stockAlerts || [])
                setHourlySales(data.hourlySales || [])
                setDebtSummary(data.debtSummary || null)
                setLoadingCharts(false)
            })
            .catch(() => setLoadingCharts(false))
    }, [])

    return (
        <div className="space-y-8 pb-8">
            <StatsCards stats={stats} loading={loadingStats} />

            <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    Actions Rapides
                </h2>
                <QuickActions />
            </section>

            {/* Aperçu des Ventes + Ventes Récentes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <SalesChart data={chartData} loading={loadingStats} />
                </div>

                <div className="bg-background p-6 rounded-2xl shadow-sm border">
                    <h3 className="text-xl font-bold mb-6">Ventes Récentes</h3>
                    <div className="space-y-6">
                        {loadingSales ? (
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
                                <p className="font-extrabold text-sm text-primary">
                                    +{new Intl.NumberFormat('fr-FR', { notation: "compact", maximumFractionDigits: 1 }).format(sale.total)} F
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Indicateurs de pilotage ── */}
            <div>
                <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                    Indicateurs de Pilotage
                </h2>

                {/* Ligne 1 : Top Produits + Alertes Stock */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                        <TopProductsChart data={topProducts} loading={loadingCharts} />
                    </div>
                    <div>
                        <StockAlertsWidget data={stockAlerts} loading={loadingCharts} />
                    </div>
                </div>

                {/* Ligne 2 : Activité horaire + Résumé Dettes */}
                <HourlySalesChart
                    hourlySales={hourlySales}
                    debtSummary={debtSummary}
                    loading={loadingCharts}
                />
            </div>
        </div>
    )
}
