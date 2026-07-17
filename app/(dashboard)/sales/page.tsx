"use client"

import { SaleForm } from "@/components/sales/sale-form"

export default function SalesPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h2 className="text-xl font-bold">Nouvelle vente</h2>
                </div>
            </div>
            <SaleForm />
        </div>
    )
}
