"use client"

import { useEffect, useState } from "react"
import { Plus, ShoppingCart, Package, AlertTriangle, Users, TrendingUp, TrendingDown, Clock, ChevronRight, Calendar, FileText, Truck, Bell, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { format, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [mounted, setMounted] = useState(false)

    const [statsData, setStatsData] = useState<any[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [topProducts, setTopProducts] = useState<any[]>([])
    const [stockAlerts, setStockAlerts] = useState<any[]>([])
    const [recentSales, setRecentSales] = useState<any[]>([])
    const [activity, setActivity] = useState<any[]>([])
    const [distribution, setDistribution] = useState<any[]>([])
    
    // Filters
    const [salesPeriod, setSalesPeriod] = useState("jour")
    const [distType, setDistType] = useState("produit")

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [statsRes, chartsRes, salesRes] = await Promise.all([
                    fetch(`/api/dashboard/stats?period=${salesPeriod}`),
                    fetch(`/api/dashboard/charts?distType=${distType}`),
                    fetch('/api/sales')
                ])

                if (statsRes.ok) {
                    const stats = await statsRes.json()
                    setStatsData(stats.stats || [])
                    
                    // Format chart data for the AreaChart
                    const formattedChartData = (stats.chartData || []).map((item: any) => ({
                        date: item.date,
                        ventes: item.total,
                        benefice: item.total * 0.35 // Estimated profit for visualization
                    }))
                    setChartData(formattedChartData)
                }

                if (chartsRes.ok) {
                    const charts = await chartsRes.json()
                    setTopProducts(charts.topProducts || [])
                    setStockAlerts(charts.stockAlerts || [])

                    const colors = ["#4F46E5", "#8B5CF6", "#0EA5E9", "#F59E0B", "#EF4444"]
                    const topItems = charts.distributionData || charts.topProducts || []
                    let dist: any[] = []
                    let totalRev = topItems.reduce((sum: number, p: any) => sum + p.totalRevenue, 0)
                    
                    if (totalRev > 0) {
                        dist = topItems.slice(0, 3).map((p: any, i: number) => ({
                            name: p.designation,
                            value: Math.round((p.totalRevenue / totalRev) * 100),
                            color: colors[i],
                            amount: p.totalRevenue
                        }))
                        
                        const othersRev = topItems.slice(3).reduce((sum: number, p: any) => sum + p.totalRevenue, 0)
                        if (othersRev > 0) {
                            dist.push({
                                name: "Autres",
                                value: Math.round((othersRev / totalRev) * 100),
                                color: colors[3],
                                amount: othersRev
                            })
                        }
                    } else {
                        // Fallback empty data for pie chart
                        dist = [{ name: "Aucune vente", value: 100, color: "#E5E7EB", amount: 0 }]
                    }
                    setDistribution(dist)
                }

                if (salesRes.ok) {
                    const sales = await salesRes.json()
                    setRecentSales(sales.slice(0, 5))
                    
                    const activities = sales.slice(0, 5).map((sale: any) => ({
                        type: "Vente",
                        text: `Nouvelle vente ${sale.transactionId || sale.id}`,
                        time: formatDistanceToNow(new Date(sale.saleDate), { addSuffix: true, locale: fr }),
                        client: sale.client?.name || "Client anonyme"
                    }))
                    setActivity(activities)
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
                setMounted(true)
            }
        }
        
        fetchData()
    }, [salesPeriod, distType])

    const getStat = (label: string) => statsData.find(s => s.label === label)?.rawValue || 0;
    
    const ventesTotales = getStat("CA de l'Année");
    const benefice = getStat("Bénéfice Année");
    const stockTotal = getStat("Stock Total");
    const rupturesStock = getStat("Alertes Stock");
    const venteDuJour = getStat("CA du Jour");

    const formatCompactFCFA = (number: number) => {
        if (!number) return "0 F";
        return new Intl.NumberFormat("fr-FR", {
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(number) + " F";
    }

    const formatStandardFCFA = (number: number) => {
        if (!number) return "0 F";
        return new Intl.NumberFormat("fr-FR", {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number) + " F";
    }

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case "PAYEE":
            case "Terminée": return "bg-emerald-100 text-emerald-700"
            case "EN_COURS":
            case "PARTIELLE":
            case "En cours": return "bg-amber-100 text-amber-700"
            case "ANNULEE":
            case "Annulée": return "bg-red-100 text-red-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    if (!mounted) return null;

    return (
        <div className="space-y-4 pb-8 px-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
                    <p className="text-sm text-muted-foreground">Bienvenue John Doe, voici un aperçu de votre activité.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            {format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "dd MMM yyyy", { locale: fr })} - {format(new Date(), "dd MMM yyyy", { locale: fr })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Ventes totales */}
                <Card className="rounded-xl border bg-white shadow-sm">
                    <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Ventes totales</p>
                                <h3 className="text-lg font-bold mt-1">{formatCompactFCFA(ventesTotales)}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-primary/10">
                                <ShoppingCart className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-medium">+12,5% vs mois préc.</p>
                    </CardContent>
                </Card>

                {/* Bénéfice */}
                <Card className="rounded-xl border bg-white shadow-sm">
                    <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Bénéfice</p>
                                <h3 className="text-lg font-bold mt-1">{formatCompactFCFA(benefice)}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-100">
                                <TrendingUp className="w-4 h-4 text-emerald-600" />
                            </div>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-medium">+8,3% vs mois préc.</p>
                    </CardContent>
                </Card>

                {/* Produits en stock */}
                <Card className="rounded-xl border bg-white shadow-sm">
                    <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">En stock</p>
                                <h3 className="text-lg font-bold mt-1">{formatCompactFCFA(stockTotal).replace(' F', '')}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-amber-100">
                                <Package className="w-4 h-4 text-amber-600" />
                            </div>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-medium">+5,7% vs mois préc.</p>
                    </CardContent>
                </Card>

                {/* Ruptures de stock */}
                <Card className="rounded-xl border bg-white shadow-sm">
                    <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Ruptures</p>
                                <h3 className="text-lg font-bold mt-1">{rupturesStock}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-red-100">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                        </div>
                        <p className="text-[10px] text-red-600 font-medium">-12,2% vs mois préc.</p>
                    </CardContent>
                </Card>

                {/* Vente du jour */}
                <Card className="rounded-xl border bg-white shadow-sm">
                    <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Vente du jour</p>
                                <h3 className="text-lg font-bold mt-1">{formatCompactFCFA(venteDuJour)}</h3>
                            </div>
                            <div className="p-2 rounded-lg bg-indigo-100">
                                <Users className="w-4 h-4 text-indigo-600" />
                            </div>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-medium">+15,8% vs Hier</p>
                    </CardContent>
                </Card>
            </div>

            {/* Accès Rapide */}
            <div className="space-y-3 pt-2">
                <h2 className="text-lg font-bold">Accès rapide</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button onClick={() => router.push("/products/new")} variant="ghost" className="h-auto p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between hover:bg-muted/50 w-full group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">Ajouter un produit</p>
                                <p className="text-xs text-muted-foreground font-normal">Enrichir votre catalogue</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <Button onClick={() => router.push("/sales")} variant="ghost" className="h-auto p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between hover:bg-muted/50 w-full group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">Nouvelle vente</p>
                                <p className="text-xs text-muted-foreground font-normal">Créer une vente rapide</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <Button onClick={() => router.push("/stock")} variant="ghost" className="h-auto p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between hover:bg-muted/50 w-full group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">Alerte stock</p>
                                <p className="text-xs text-muted-foreground font-normal">{stockAlerts.length} produits critiques</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <Button onClick={() => router.push("/reports")} variant="ghost" className="h-auto p-4 rounded-xl border bg-white shadow-sm flex items-center justify-between hover:bg-muted/50 w-full group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">Rapport de ventes</p>
                                <p className="text-xs text-muted-foreground font-normal">Consulter les rapports</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Row 1: Évolution des ventes (60%) & Répartition des ventes (40%) */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch mt-4">
                {/* Évolution des ventes */}
                <Card className="lg:w-[60%] rounded-xl border bg-white shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
                        <div>
                            <CardTitle className="text-sm font-bold">Évolution des ventes</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span className="text-[10px] text-muted-foreground">Ventes (F)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] text-muted-foreground">Bénéfice (F)</span>
                                </div>
                            </div>
                        </div>
                        <Select value={salesPeriod} onValueChange={setSalesPeriod}>
                            <SelectTrigger className="w-28 rounded-lg h-7 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="jour">Par jour</SelectItem>
                                <SelectItem value="semaine">Par semaine</SelectItem>
                                <SelectItem value="mois">Par mois</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="px-5 pb-4 flex-1 flex flex-col">
                        <div className="flex-1 w-full min-h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: -15 }}>
                                    <defs>
                                        <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280" }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => formatCompactFCFA(val).replace(' F', '')} tick={{ fontSize: 10, fill: "#6B7280" }} width={60} />
                                    <Tooltip
                                        formatter={(value: number) => [formatStandardFCFA(value), ""]}
                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", fontSize: "12px" }}
                                    />
                                    <Area type="monotone" dataKey="ventes" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVentes)" />
                                    <Area type="monotone" dataKey="benefice" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBenefice)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Répartition des ventes */}
                <Card className="lg:w-[40%] rounded-xl border bg-white shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
                        <CardTitle className="text-sm font-bold">Répartition des ventes</CardTitle>
                        <Select value={distType} onValueChange={setDistType}>
                            <SelectTrigger className="w-28 rounded-lg h-7 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="produit">Par produit</SelectItem>
                                <SelectItem value="categorie">Par catégorie</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="px-5 pb-3 flex-1 flex flex-col">
                        <div className="flex-1 min-h-[120px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number, name: string, props: any) => [`${value}%`, name]} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
                            {distribution.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                        <span className="text-muted-foreground truncate" title={item.name}>{item.name}</span>
                                    </div>
                                    <span className="font-medium ml-1 shrink-0">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 pt-2 border-t flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total</span>
                            <span className="font-bold text-sm">{formatStandardFCFA(ventesTotales)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Ventes récentes (60%) & Top produits (40%) */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch mt-4">
                {/* Ventes récentes */}
                <Card className="lg:w-[60%] rounded-xl border bg-white shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
                        <CardTitle className="text-sm font-bold">Ventes récentes</CardTitle>
                        <Button variant="ghost" className="h-7 text-xs text-primary" onClick={() => router.push("/sales")}>Voir tout</Button>
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ID VENTE</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CLIENT</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">MONTANT</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">STATUT</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DATE</TableHead>
                                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentSales.map((sale) => (
                                    <TableRow key={sale.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/sales/${sale.id}`)}>
                                        <TableCell className="font-mono text-[10px] text-muted-foreground">{sale.transactionId || sale.id}</TableCell>
                                        <TableCell className="text-xs font-medium">{sale.client?.name || "Client anonyme"}</TableCell>
                                        <TableCell className="font-bold text-xs">{formatStandardFCFA(sale.totalTtc)}</TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusColor(sale.status)} text-[10px] px-1.5 py-0.5 border-0`}>{sale.status === "PAYEE" ? "Terminée" : sale.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-[10px] text-muted-foreground">
                                            {format(new Date(sale.saleDate), "dd MMM yyyy HH:mm", { locale: fr })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md">
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentSales.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-4">Aucune vente récente</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Top produits */}
                <Card className="lg:w-[40%] rounded-xl border bg-white shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
                        <CardTitle className="text-sm font-bold">Top produits</CardTitle>
                        <Button variant="ghost" className="h-7 text-xs text-primary" onClick={() => router.push("/products")}>Voir tout</Button>
                    </CardHeader>
                    <CardContent className="px-5 pb-4 space-y-3">
                        {topProducts.slice(0, 5).map((product, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5 w-full">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{product.designation}</p>
                                        <div className="w-full bg-muted rounded-full h-1 mt-1.5">
                                            <div className="bg-primary h-1 rounded-full" style={{ width: `${Math.max(10, Math.min(100, (product.totalQty / 200) * 100))}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right ml-4 shrink-0">
                                    <p className="font-bold text-xs">{formatCompactFCFA(product.totalRevenue)}</p>
                                    <p className="text-[10px] text-muted-foreground">{product.totalQty} ventes</p>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground py-4">Aucune donnée</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Activité récente (60%) & Stock critique (40%) */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch mt-4">
                {/* Activité récente */}
                <Card className="lg:w-[60%] rounded-xl border bg-white shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
                        <CardTitle className="text-sm font-bold">Activité récente</CardTitle>
                        <Button variant="ghost" className="h-7 text-xs text-primary" onClick={() => router.push("/sales")}>Voir tout</Button>
                    </CardHeader>
                    <CardContent className="px-5 pb-4 space-y-3">
                        {activity.map((item, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium">{item.text}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.client}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground">{item.time}</p>
                                </div>
                            </div>
                        ))}
                        {activity.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground py-4">Aucune activité</div>
                        )}
                    </CardContent>
                </Card>

                {/* Stock critique */}
                <Card className="lg:w-[40%] rounded-xl border bg-white shadow-sm flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-4">
                        <CardTitle className="text-sm font-bold">Stock critique</CardTitle>
                        <Button variant="ghost" className="h-7 text-xs text-primary" onClick={() => router.push("/stock")}>Voir tout</Button>
                    </CardHeader>
                    <CardContent className="px-5 pb-4 space-y-2.5">
                        {stockAlerts.slice(0, 5).map((product, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                        <Package className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium truncate max-w-[140px]">{product.name}</p>
                                        <p className="text-[10px] text-muted-foreground">Min: {product.stockMin}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{product.quantity}</Badge>
                                    <p className="text-[8px] text-muted-foreground mt-0.5">Restant</p>
                                </div>
                            </div>
                        ))}
                        {stockAlerts.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground py-4">Aucun stock critique</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
