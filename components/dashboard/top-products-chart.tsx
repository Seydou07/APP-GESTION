"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { formatCompactNumber } from "@/lib/utils"
import { Trophy } from "lucide-react"

interface TopProductsChartProps {
    data?: { name: string; fullName: string; quantite: number; total: number }[]
    loading?: boolean
}

const COLORS = ["#3C91E6", "#5BA4EB", "#7DB7F0", "#9ECAF5", "#BFD9F7", "#DDF0FF"]

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload
        return (
            <div className="bg-white border border-border rounded-2xl shadow-xl p-4 text-sm space-y-1 max-w-[200px]">
                <p className="font-black text-foreground text-[13px] leading-tight">{d.fullName}</p>
                <p className="text-primary font-bold">{d.total.toLocaleString()} F</p>
                <p className="text-muted-foreground">{d.quantite} unités vendues</p>
            </div>
        )
    }
    return null
}

export function TopProductsChart({ data, loading }: TopProductsChartProps) {
    if (loading || !data) {
        return (
            <div className="h-[340px] w-full bg-background p-6 rounded-2xl shadow-sm border animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-muted rounded-xl" />
                    <div className="h-5 w-44 bg-muted rounded" />
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 mb-4">
                        <div className="h-4 bg-muted rounded" style={{ width: `${20 + i * 12}%` }} />
                    </div>
                ))}
            </div>
        )
    }

    if (!data.length) {
        return (
            <div className="h-[340px] w-full bg-background p-6 rounded-2xl shadow-sm border flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Trophy className="w-10 h-10 opacity-20" />
                <p className="text-sm">Aucune donnée sur 30 jours</p>
            </div>
        )
    }

    return (
        <div className="h-[340px] w-full bg-background p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-base font-black leading-tight">Top Produits</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">30 derniers jours</p>
                </div>
            </div>
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                        <XAxis
                            type="number"
                            stroke="#888"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={v => formatCompactNumber(v)}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#888"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            width={90}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(60,145,230,0.05)" }} />
                        <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22} animationDuration={1200}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
