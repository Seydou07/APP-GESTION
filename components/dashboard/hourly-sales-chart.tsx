"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCompactNumber } from "@/lib/utils"
import { Activity, CreditCard } from "lucide-react"

interface HourlySalesChartProps {
    hourlySales?: { heure: string; total: number }[]
    debtSummary?: { impaye: number; partiel: number; regle: number; totalDu: number }
    loading?: boolean
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-border rounded-2xl shadow-xl p-3 text-sm">
                <p className="font-black text-foreground">{label}</p>
                <p className="text-primary font-bold mt-0.5">{(payload[0].value as number).toLocaleString()} F</p>
            </div>
        )
    }
    return null
}

export function HourlySalesChart({ hourlySales, debtSummary, loading }: HourlySalesChartProps) {
    const hasActivity = hourlySales?.some(h => h.total > 0)

    const debtTotal = (debtSummary?.impaye || 0) + (debtSummary?.partiel || 0)

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Activité horaire */}
            <div className="md:col-span-2 bg-background p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-base font-black leading-tight">Activité du Jour</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Ventes par heure aujourd'hui</p>
                    </div>
                </div>

                {loading ? (
                    <div className="h-[180px] bg-muted/30 rounded-xl animate-pulse" />
                ) : !hasActivity ? (
                    <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm flex-col gap-2">
                        <Activity className="w-8 h-8 opacity-20" />
                        <span>Aucune vente enregistrée aujourd'hui</span>
                    </div>
                ) : (
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={hourlySales} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3C91E6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3C91E6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="heure" stroke="#888" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => formatCompactNumber(v)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#3C91E6"
                                    strokeWidth={2.5}
                                    fill="url(#colorHourly)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: "#3C91E6", strokeWidth: 0 }}
                                    animationDuration={1400}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Résumé Dettes */}
            <div className="bg-background p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-black leading-tight">Crédits Clients</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Dettes en cours</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted rounded-xl" />)}
                    </div>
                ) : (
                    <div className="space-y-3 flex-1">
                        <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Impayées</p>
                            <p className="text-2xl font-black text-red-700">{debtSummary?.impaye || 0}</p>
                            <p className="text-xs text-red-500">clients</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Partielles</p>
                            <p className="text-2xl font-black text-amber-700">{debtSummary?.partiel || 0}</p>
                            <p className="text-xs text-amber-500">clients</p>
                        </div>
                        <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 mt-auto">
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1">Total restant dû</p>
                            <p className="text-xl font-black text-violet-700">
                                {(debtSummary?.totalDu || 0).toLocaleString()} F
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
