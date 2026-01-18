import { ShoppingCart, Users, DollarSign, Package } from "lucide-react"

const stats = [
    {
        label: "Ventes Totales",
        value: "1,250,000 FCFA",
        icon: DollarSign,
        color: "text-blue-600",
        bg: "bg-blue-100",
    },
    {
        label: "Nouveaux Produits",
        value: "12",
        icon: Package,
        color: "text-yellow-600",
        bg: "bg-yellow-100",
    },
    {
        label: "Clients",
        value: "2,543",
        icon: Users,
        color: "text-orange-600",
        bg: "bg-orange-100",
    },
]

export function StatsCards() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-background p-6 rounded-2xl flex items-center gap-6 shadow-sm">
                    <div className={`p-4 rounded-xl ${stat.bg}`}>
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">{stat.value}</h3>
                        <p className="text-muted-foreground">{stat.label}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
