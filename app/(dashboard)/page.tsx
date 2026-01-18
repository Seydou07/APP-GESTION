import { StatsCards } from "@/components/dashboard/stats-cards"
import { SalesChart } from "@/components/dashboard/sales-chart"

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <StatsCards />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <SalesChart />
                </div>

                <div className="bg-background p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Ventes Récentes</h3>
                    <div className="space-y-6">
                        {/* Mock recent sales list */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        C{i}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Client Savadogo</p>
                                        <p className="text-xs text-muted-foreground">Il y a {i * 10} min</p>
                                    </div>
                                </div>
                                <p className="font-bold text-sm text-primary">+4,500 F</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
