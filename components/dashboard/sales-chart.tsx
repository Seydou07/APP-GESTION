"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { formatCompactNumber } from "@/lib/utils"

interface SalesChartProps {
    data?: { name: string; total: number }[]
    loading?: boolean
}

export function SalesChart({ data, loading }: SalesChartProps) {
    if (loading || !data) {
        return (
            <div className="h-[400px] w-full bg-background p-6 rounded-2xl shadow-sm border animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-10" />
                <div className="flex items-end justify-between h-[280px] px-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="w-10 bg-muted rounded-t-lg" style={{ height: `${Math.random() * 100}%` }} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="h-[400px] w-full bg-background p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md">
            <h3 className="text-xl font-bold mb-6">Aperçu des Ventes</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${formatCompactNumber(value)}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(60, 145, 230, 0.05)' }}
                            contentStyle={{
                                backgroundColor: "#fff",
                                borderRadius: "12px",
                                border: "1px solid #f0f0f0",
                                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                                padding: "12px"
                            }}
                            formatter={(value: number) => [`${value.toLocaleString()} F`, "Total"]}
                        />
                        <Bar
                            dataKey="total"
                            fill="#3C91E6"
                            radius={[6, 6, 0, 0]}
                            barSize={40}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
