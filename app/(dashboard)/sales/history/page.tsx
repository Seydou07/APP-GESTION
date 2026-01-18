"use client"

import { useEffect, useState } from "react"
import { Search, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function HistoryPage() {
    const [history, setHistory] = useState([])

    useEffect(() => {
        // In a real app, you would fetch from /api/sales/history
        // Simulating data for now
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold">Historique des Ventes</h2>
                <p className="text-muted-foreground">Consultez toutes les transactions passées.</p>
            </div>

            <div className="bg-background rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Rechercher par client ou produit..." className="pl-10 rounded-xl" />
                    </div>
                    <div className="relative w-48">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" className="pl-10 rounded-xl" />
                    </div>
                </div>

                <div className="rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent uppercase text-[10px] font-bold tracking-wider">
                                <TableHead>Date</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Produit</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground italic">
                                    Aucun historique disponible pour le moment.
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
