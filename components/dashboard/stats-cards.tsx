import { TrendingUp, Package, Users, AlertTriangle, DollarSign, Wallet, TrendingDown, BarChart3 } from "lucide-react"
import { formatCompactNumber } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const iconMap: Record<string, any> = {
    "CA du Jour": TrendingUp,
    "CA du Mois": TrendingUp,
    "CA de l'Année": TrendingUp,
    "Bénéfice Jour": TrendingUp,
    "Bénéfice Mois": TrendingUp,
    "Bénéfice Année": TrendingUp,
    "Solde Caisse": Wallet,
    "Produits": Package,
    "Clients": Users,
    "Stock Total": Package,
    "Dépenses Mois": TrendingDown,
    "Créances Clients": Wallet,
    "Alertes Stock": AlertTriangle,
}

const infoMap: Record<string, string> = {
    "CA du Jour": "Chiffre d'affaires total du jour",
    "CA du Mois": "Chiffre d'affaires total du mois en cours",
    "CA de l'Année": "Chiffre d'affaires total de l'année en cours",
    "Bénéfice Jour": "Bénéfice brut du jour (CA - coût des marchandises)",
    "Bénéfice Mois": "Bénéfice net du mois (CA - coûts - dépenses)",
    "Bénéfice Année": "Bénéfice brut de l'année (CA - coût des marchandises)",
    "Solde Caisse": "Solde actuel de la caisse (entrées - sorties)",
    "Produits": "Nombre total de produits dans le catalogue",
    "Clients": "Nombre de clients enregistrés",
    "Stock Total": "Quantité totale de produits en stock dans tous les entrepôts",
    "Dépenses Mois": "Total des dépenses du mois en cours",
    "Créances Clients": "Montant total des dettes clients non soldées",
    "Alertes Stock": "Nombre de produits avec stock en dessous du seuil minimum",
}

const colorMap: Record<string, { text: string; bg: string }> = {
    "CA du Jour": { text: "text-primary", bg: "bg-primary/10" },
    "CA du Mois": { text: "text-primary", bg: "bg-primary/10" },
    "CA de l'Année": { text: "text-primary", bg: "bg-primary/10" },
    "Bénéfice Jour": { text: "text-emerald-600", bg: "bg-emerald-100" },
    "Bénéfice Mois": { text: "text-emerald-600", bg: "bg-emerald-100" },
    "Bénéfice Année": { text: "text-emerald-600", bg: "bg-emerald-100" },
    "Solde Caisse": { text: "text-primary", bg: "bg-primary/10" },
    "Produits": { text: "text-amber-600", bg: "bg-amber-100" },
    "Clients": { text: "text-indigo-600", bg: "bg-indigo-100" },
    "Stock Total": { text: "text-violet-600", bg: "bg-violet-100" },
    "Dépenses Mois": { text: "text-rose-600", bg: "bg-rose-100" },
    "Créances Clients": { text: "text-orange-600", bg: "bg-orange-100" },
    "Alertes Stock": { text: "text-red-600", bg: "bg-red-100" },
}

interface StatsCardsProps {
    stats?: { label: string; rawValue: number; type: string }[]
    loading?: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-6 rounded-xl flex items-center gap-6 shadow-sm animate-pulse border bg-card">
                        <div className="w-16 h-16 bg-muted rounded-xl" />
                        <div className="space-y-2">
                            <div className="h-8 w-32 bg-muted rounded" />
                            <div className="h-4 w-20 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!stats || stats.length === 0) {
        const defaultStats = [
            { label: "CA du Jour", rawValue: 0, type: "currency" },
            { label: "CA du Mois", rawValue: 0, type: "currency" },
            { label: "CA de l'Année", rawValue: 0, type: "currency" },
            { label: "Bénéfice Jour", rawValue: 0, type: "currency" },
            { label: "Bénéfice Mois", rawValue: 0, type: "currency" },
            { label: "Solde Caisse", rawValue: 0, type: "currency" },
        ]
        stats = defaultStats
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat) => {
                const Icon = iconMap[stat.label] || BarChart3
                const colors = colorMap[stat.label] || { text: "text-primary", bg: "bg-primary/10" }
                const infoText = infoMap[stat.label] || ""

                const displayValue = stat.type === "currency"
                    ? `${formatCompactNumber(stat.rawValue)} F`
                    : formatCompactNumber(stat.rawValue)

                const fullValue = stat.type === "currency"
                    ? `${stat.rawValue.toLocaleString()} FCFA`
                    : stat.rawValue.toLocaleString()

                return (
                    <div
                        key={stat.label}
                        className="p-6 rounded-xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all border bg-card"
                        title={fullValue}
                    >
                        <div className={`p-4 rounded-xl transition-colors ${colors.bg}`}>
                            <Icon className={`w-8 h-8 ${colors.text}`} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold tracking-tight hover:text-primary transition-colors">
                                {displayValue}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider">{stat.label}</p>
                                {infoText && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-primary cursor-help transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-[200px] text-center">
                                            {infoText}
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
