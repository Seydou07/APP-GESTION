import { Users, DollarSign, Package } from "lucide-react"
import { formatCompactNumber } from "@/lib/utils"

const iconMap: Record<string, any> = {
    "Ventes Totales": DollarSign,
    "Nouveaux Produits": Package,
    "Clients": Users,
}

const colorMap: Record<string, { text: string; bg: string }> = {
    "Ventes Totales": { text: "text-blue-600", bg: "bg-blue-100" },
    "Nouveaux Produits": { text: "text-amber-600", bg: "bg-amber-100" },
    "Clients": { text: "text-emerald-600", bg: "bg-emerald-100" },
}

interface StatsCardsProps {
    stats?: { label: string; rawValue: number; type: string }[]
    loading?: boolean
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-background p-6 rounded-2xl flex items-center gap-6 shadow-sm animate-pulse border">
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => {
                const Icon = iconMap[stat.label] || Package
                const colors = colorMap[stat.label] || { text: "text-primary", bg: "bg-primary/10" }

                const displayValue = stat.type === "currency"
                    ? `${formatCompactNumber(stat.rawValue)} F`
                    : formatCompactNumber(stat.rawValue)

                const fullValue = stat.type === "currency"
                    ? `${stat.rawValue.toLocaleString()} FCFA`
                    : stat.rawValue.toLocaleString()

                return (
                    <div
                        key={stat.label}
                        className="bg-background p-6 rounded-2xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all border group cursor-default"
                        title={fullValue}
                    >
                        <div className={`p-4 rounded-xl transition-colors ${colors.bg}`}>
                            <Icon className={`w-8 h-8 ${colors.text}`} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                                {displayValue}
                            </h3>
                            <p className="text-muted-foreground font-medium text-xs uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
