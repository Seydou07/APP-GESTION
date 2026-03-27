"use client"

import { Card } from "@/components/ui/card"
import {
    HelpCircle,
    Book,
    MessageSquare,
    Phone,
    Mail,
    Wrench,
    AlertTriangle,
    CheckCircle2,
    ExternalLink
} from "lucide-react"

export default function HelpPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Besoin d'aide ou Maintenance ?</h1>
                    <p className="text-muted-foreground text-lg">Retrouvez ici toutes les informations pour bien utiliser K.M.BOMI et nous contacter.</p>
                </div>
                <HelpCircle className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 text-primary/5 -rotate-12" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Guide and Directives */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 border-none shadow-sm bg-background">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500 rounded-lg text-white">
                                <Book className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">Guide de Fonctionnement</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                                <div>
                                    <h3 className="font-bold">Gestion des Ventes</h3>
                                    <p className="text-sm text-muted-foreground">Utilisez l'interface de vente pour ajouter des produits au panier. Une fois la vente confirmée, le stock est automatiquement déduit et un reçu est généré.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                                <div>
                                    <h3 className="font-bold">Gestion du Stock</h3>
                                    <p className="text-sm text-muted-foreground">Vérifiez régulièrement l'onglet "Stocks". Les articles en rouge sont en dessous du seuil d'alerte défini lors de la création du produit.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                                <div>
                                    <h3 className="font-bold">Historique & Rapports</h3>
                                    <p className="text-sm text-muted-foreground">Toutes les ventes sont archivées. Vous pouvez consulter l'historique complet pour suivre vos performances quotidiennes.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-sm bg-amber-50/50 border border-amber-100">
                        <div className="flex items-center gap-3 mb-4 text-amber-600">
                            <AlertTriangle className="w-5 h-5" />
                            <h2 className="text-lg font-bold">Signaler un Problème</h2>
                        </div>
                        <p className="text-sm text-amber-800">Si vous rencontrez un bug ou une erreur d'affichage, merci de prendre une capture d'écran et de nous l'envoyer par WhatsApp ou Email avec une brève description.</p>
                    </Card>
                </div>

                {/* Right side: Contact Info */}
                <div className="space-y-6">
                    <Card className="p-6 border-none shadow-sm bg-primary text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/20 rounded-lg text-white">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold">Nous Contacter</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/70">Téléphone / WhatsApp</p>
                                    <p className="font-bold">+212 665 122 930</p>
                                    <p className="font-bold">+226 73256352</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-white/70">Email Support</p>
                                    <a
                                        href="https://soumaila-savadogo.omnia-elearning.com/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold hover:underline transition-all flex items-center gap-2"
                                    >
                                        support@kmbomi.com
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-xs text-white/60 italic text-center">Disponible du Lundi au Samedi <br /> 08h00 - 18h00</p>
                        </div>
                    </Card>

                    <Card className="p-6 border-none shadow-sm bg-background">
                        <div className="flex items-center gap-3 mb-2">
                            <Wrench className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-bold">Maintenance</h2>
                        </div>
                        <div className="space-y-2 text-sm">

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">État du serveur</span>
                                <span className="text-emerald-500 font-bold flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Opérationnel
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Dernière Mise à jour</span>
                                <span className="text-right">Janvier 2026</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
