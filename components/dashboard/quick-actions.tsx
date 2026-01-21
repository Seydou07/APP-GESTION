"use client"

import { Card } from "@/components/ui/card"
import { ShoppingCart, PlusCircle, Package, Settings, ArrowRight } from "lucide-react"
import Link from "next/link"

const actions = [
    {
        title: "Nouvelle Vente",
        description: "Enregistrer de nouveaux articles",
        icon: ShoppingCart,
        href: "/sales",
        color: "bg-blue-500",
        hover: "hover:border-blue-500/50"
    },
    {
        title: "Nouveau Produit",
        description: "Ajouter un article au catalogue",
        icon: PlusCircle,
        href: "/products",
        color: "bg-emerald-500",
        hover: "hover:border-emerald-500/50"
    },
    {
        title: "État du Stock",
        description: "Vérifier les quantités disponibles",
        icon: Package,
        href: "/stock",
        color: "bg-amber-500",
        hover: "hover:border-amber-500/50"
    },
    {
        title: "Paramètres",
        description: "Configuration de l'application",
        icon: Settings,
        href: "/settings",
        color: "bg-slate-500",
        hover: "hover:border-slate-500/50"
    },
]

export function QuickActions() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {actions.map((action) => (
                <Link key={action.href} href={action.href}>
                    <Card className={`group p-4 transition-all duration-300 border border-transparent shadow-sm hover:shadow-md ${action.hover} cursor-pointer h-full`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`${action.color} p-3 rounded-xl text-white shadow-lg`}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-base leading-tight">{action.title}</h3>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
