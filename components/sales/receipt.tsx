"use client"

import { Button } from "@/components/ui/button"
import { Printer, Home } from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ReceiptProps {
    data: {
        designation: string
        quantite: number
        prixUnitaire: number
        total: number
        client?: string
        date: string
        logoUrl?: string
    }
}

export function Receipt({ data }: ReceiptProps) {
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="max-w-md mx-auto bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 print:shadow-none print:border-none print:p-0 print:mx-0 print:w-full">
            <div className="flex flex-col items-center mb-8">
                {data.logoUrl ? (
                    <img src={data.logoUrl} alt="Logo" className="w-24 h-auto mb-4" />
                ) : (
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold opacity-10 mb-4 print:hidden">
                        Logo
                    </div>
                )}
                <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">Reçu de Paiement</h1>
                <div className="w-full border-b-2 border-dashed border-gray-300 my-4" />
                <p className="text-sm font-bold">K.M.BOMI - GESTION</p>
                <p className="text-xs text-muted-foreground">{data.date}</p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between text-sm">
                    <span className="font-bold">Client:</span>
                    <span>{data.client || "Client Comptoir"}</span>
                </div>

                <Table className="text-sm">
                    <TableHeader>
                        <TableRow className="border-b uppercase text-[10px] text-gray-500 hover:bg-transparent">
                            <TableHead className="h-auto py-2 text-left font-medium">Designation</TableHead>
                            <TableHead className="h-auto py-2 text-center font-medium">Qté</TableHead>
                            <TableHead className="h-auto py-2 text-right font-medium">Prix</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="py-4 font-bold">{data.designation}</TableCell>
                            <TableCell className="py-4 text-center font-bold">x{data.quantite}</TableCell>
                            <TableCell className="py-4 text-right font-bold">{data.prixUnitaire} F</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <div className="flex justify-between items-center py-4">
                    <span className="text-lg font-bold">TOTAL</span>
                    <span className="text-2xl font-black text-primary">{data.total.toLocaleString()} FCFA</span>
                </div>
            </div>

            <div className="mt-12 text-center text-[10px] text-gray-400 uppercase tracking-widest">
                Merci pour votre confiance !
            </div>

            <div className="flex gap-4 mt-8 print:hidden">
                <Button onClick={handlePrint} className="flex-1 rounded-xl h-12">
                    <Printer className="w-4 h-4 mr-2" /> Imprimer
                </Button>
                <Button variant="outline" asChild className="rounded-xl h-12">
                    <Link href="/"><Home className="w-4 h-4 mr-2" /> Accueil</Link>
                </Button>
            </div>
        </div>
    )
}
