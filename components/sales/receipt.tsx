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

export interface ReceiptItem {
    designation: string
    quantite: number | string
    prixUnitaire: number
}

export interface ReceiptData {
    title?: string
    subtitle?: string
    client?: string
    date: string
    items: ReceiptItem[]
    total: number
    logoUrl?: string
    reference?: string
    extraInfo?: { label: string; value: string | number }[]
    footerMessage?: string
}

interface ReceiptProps {
    data: ReceiptData
    showButtons?: boolean
}

export function Receipt({ data, showButtons = true }: ReceiptProps) {
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-100 print:shadow-none print:border-none print:p-0 print:mx-0 print:w-full">
            <div className="flex flex-col items-center mb-8">
                {data.logoUrl ? (
                    <img src={data.logoUrl} alt="Logo" className="w-24 h-auto mb-4" />
                ) : (
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold opacity-10 mb-4 print:hidden">
                        Logo
                    </div>
                )}
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-widest mb-1 text-center">
                    {data.title || "Reçu de Paiement"}
                </h1>
                {data.subtitle && (
                    <p className="text-sm font-bold opacity-80 uppercase tracking-tighter mb-2">
                        {data.subtitle}
                    </p>
                )}
                <div className="w-full border-b-2 border-dashed border-gray-300 my-4" />
                <p className="text-sm font-black uppercase">K.M.BOMI - GESTION</p>
                <div className="flex flex-col items-center gap-1 mt-1">
                    {data.reference && <p className="text-[10px] font-mono text-muted-foreground uppercase">Réf: {data.reference}</p>}
                    <p className="text-[10px] text-muted-foreground">{data.date}</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Header Information */}
                <div className="space-y-2">
                    {data.client && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Bénéficiaire/Client:</span>
                            <span className="font-bold uppercase">{data.client}</span>
                        </div>
                    )}
                    {data.extraInfo?.map((info, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{info.label}:</span>
                            <span className="font-bold">{info.value}</span>
                        </div>
                    ))}
                </div>

                {/* Items Table */}
                <Table className="text-sm">
                    <TableHeader>
                        <TableRow className="border-b uppercase text-[10px] text-gray-500 hover:bg-transparent">
                            <TableHead className="h-auto py-2 text-left font-medium">Détails</TableHead>
                            <TableHead className="h-auto py-2 text-center font-medium">Qté</TableHead>
                            <TableHead className="h-auto py-2 text-right font-medium">Prix</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.items.map((item, index) => (
                            <TableRow key={index} className="border-none">
                                <TableCell className="py-3 font-bold leading-tight uppercase text-xs">{item.designation}</TableCell>
                                <TableCell className="py-3 text-center font-bold text-xs uppercase">
                                    {typeof item.quantite === 'number' ? `x${item.quantite}` : item.quantite}
                                </TableCell>
                                <TableCell className="py-3 text-right font-bold text-xs">{item.prixUnitaire.toLocaleString()} F</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Total Section */}
                <div className="border-t-2 border-dashed border-gray-200 pt-4 mt-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Payé</span>
                        <span className="text-2xl font-black text-primary">{data.total.toLocaleString()} FCFA</span>
                    </div>
                </div>
            </div>

            <div className="mt-12 space-y-8">
                <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                    {data.footerMessage || "Merci pour votre confiance !"}
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                        <div className="text-[8px] uppercase font-bold text-muted-foreground">Signature Client</div>
                        <div className="h-10 border-b border-gray-200"></div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[8px] uppercase font-bold text-muted-foreground">Signature K.M.BOMI</div>
                        <div className="h-10 border-b border-gray-200"></div>
                    </div>
                </div>
            </div>

            {showButtons && (
                <div className="flex gap-4 mt-10 print:hidden">
                    <Button onClick={handlePrint} className="flex-1 rounded-xl h-12 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        <Printer className="w-4 h-4 mr-2" /> Imprimer
                    </Button>
                    <Button variant="outline" asChild className="rounded-xl h-12 font-bold hover:bg-muted/50 transition-all">
                        <Link href="/"><Home className="w-4 h-4 mr-2" /> Accueil</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
