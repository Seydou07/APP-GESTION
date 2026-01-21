import { SaleForm } from "@/components/sales/sale-form"

export default function SalesPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col print:hidden">
                <h2 className="text-2xl font-bold">Interface de Vente</h2>
                <p className="text-muted-foreground">Enregistrez de nouvelles ventes et générez des reçus.</p>
            </div>
            <div className="w-full">
                <SaleForm />
            </div>
        </div>
    )
}
