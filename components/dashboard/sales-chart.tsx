"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

const data = [
    { name: "Lun", total: 12000 },
    { name: "Mar", total: 19000 },
    { name: "Mer", total: 15000 },
    { name: "Jeu", total: 22000 },
    { name: "Ven", total: 30000 },
    { name: "Sam", total: 25000 },
    { name: "Dim", total: 18000 },
]

export function SalesChart() {
    return (
        <div className="h-[400px] w-full bg-background p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-6">Aperçu des Ventes</h3>
            <ResponsiveContainer width="100%" height="80%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} F`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#fff", borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    />
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3C91E6"
                        strokeWidth={4}
                        dot={{ r: 6, fill: "#3C91E6", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
