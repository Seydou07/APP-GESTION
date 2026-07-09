import { SaleForm } from "@/components/sales/sale-form"

export default function SalesPage() {
    return (
        <div className="print:hidden">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-xl font-bold">Nouvelle vente</h2>
                </div>
            </div>
            <SaleForm />
        </div>
    )
}
