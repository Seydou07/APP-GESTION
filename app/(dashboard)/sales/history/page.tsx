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
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function HistoryPage() {
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterDate, setFilterDate] = useState("")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetch("/api/sales")
            .then(res => res.json())
            .then(data => {
                setSales(data)
                setLoading(false)
            })
    }, [])

    const filteredSales = sales.filter((sale: any) => {
        const matchesSearch =
            sale.nomClient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.designation?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesDate = filterDate ? sale.date.includes(filterDate) : true

        return matchesSearch && matchesDate
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold">Historique des Ventes</h2>
                <p className="text-muted-foreground">Consultez toutes les transactions passées.</p>
            </div>

            <div className="bg-background rounded-2xl shadow-sm border p-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par client ou produit..."
                            className="pl-10 rounded-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full md:w-48">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="date"
                            className="pl-10 rounded-xl"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30 uppercase text-[10px] font-bold tracking-wider">
                                <TableHead>Date</TableHead>
                                <TableHead>Heure</TableHead>
                                <TableHead>Prénom</TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead>Produit</TableHead>
                                <TableHead>Quantité</TableHead>
                                <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground italic">
                                        Chargement de l'historique...
                                    </TableCell>
                                </TableRow>
                            ) : filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground italic">
                                        Aucun historique correspond à votre recherche.
                                    </TableCell>
                                </TableRow>
                            ) : filteredSales.map((sale: any) => (
                                <TableRow key={sale.id} className="hover:bg-muted/20">
                                    <TableCell className="font-medium">
                                        {mounted && format(new Date(sale.date), "dd/MM/yyyy")}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {mounted && format(new Date(sale.date), "HH:mm")}
                                    </TableCell>
                                    <TableCell>{sale.prenomClient || "-"}</TableCell>
                                    <TableCell>{sale.nomClient || "Client Comptoir"}</TableCell>
                                    <TableCell>{sale.designation}</TableCell>
                                    <TableCell>x{sale.quantite}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">
                                        {sale.total.toLocaleString()} F
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
