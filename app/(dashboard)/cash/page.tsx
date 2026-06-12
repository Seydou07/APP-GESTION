"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface CashMovement {
    id: number
    moveDate: string
    type: "ENTREE" | "SORTIE"
    source: string
    amount: number
    note?: string
}

export default function CashPage() {
    const router = useRouter()
    const [movements, setMovements] = useState<CashMovement[]>([])
    const [loading, setLoading] = useState(true)
    const [balance, setBalance] = useState(0)

    useEffect(() => {
        fetch("/api/cash")
            .then(res => res.json())
            .then(data => {
                setMovements(data.movements || [])
                setBalance(data.balance || 0)
            })
            .catch(err => console.error("Error fetching cash data:", err))
            .finally(() => setLoading(false))
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(amount) + " F"
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Caisse / Trésorerie</h2>
                <Button onClick={() => router.push("/sales")}>
                    <Plus className="w-4 h-4 mr-2" /> Nouvelle vente
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Solde actuel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">
                            {formatCurrency(balance)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historique des mouvements</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Montant</TableHead>
                                    <TableHead>Note</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Aucun mouvement de caisse
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    movements.map((movement) => (
                                        <TableRow key={movement.id}>
                                            <TableCell>
                                                {new Date(movement.moveDate).toLocaleDateString("fr-FR")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={movement.type === "ENTREE" ? "default" : "destructive"}>
                                                    {movement.type === "ENTREE" ? "Entrée" : "Sortie"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{movement.source}</TableCell>
                                            <TableCell className={movement.type === "ENTREE" ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                                                {movement.type === "ENTREE" ? "+" : "-"}{formatCurrency(movement.amount)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{movement.note || "-"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
