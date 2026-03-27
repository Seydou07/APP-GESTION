"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { suggestionSchema } from "@/lib/validations"
import { z } from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Lightbulb, Loader2, Send } from "lucide-react"

type SuggestionFormValues = z.infer<typeof suggestionSchema>

interface SuggestionsDialogProps {
    children: React.ReactNode
}

export function SuggestionsDialog({ children }: SuggestionsDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SuggestionFormValues>({
        resolver: zodResolver(suggestionSchema),
        defaultValues: {
            sujet: "",
            message: "",
            auteur: "",
            email: "",
        }
    })

    const onSubmit = async (values: SuggestionFormValues) => {
        setLoading(true)
        try {
            const res = await fetch("/api/suggestions", {
                method: "POST",
                body: JSON.stringify(values),
            })

            if (!res.ok) throw new Error(await res.text())

            toast.success("Merci ! Votre suggestion a été envoyée avec succès.")
            reset()
            setIsOpen(false)
        } catch (error: any) {
            toast.error(error.message || "Une erreur est survenue lors de l'envoi.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl rounded-3xl p-0 border-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="overflow-y-auto p-8 overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {/* Background Decoration */}
                    <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />
                    <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />

                    <DialogHeader className="space-y-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-300">
                            <Lightbulb className="w-8 h-8 text-primary shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black tracking-tight">Suggestions & Idées</DialogTitle>
                            <DialogDescription className="text-muted-foreground text-base">
                                Partagez vos idées ou besoins métiers pour nous aider à améliorer K.M.BOMI pour vous.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sujet" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                    Sujet de la suggestion
                                </Label>
                                <Input
                                    id="sujet"
                                    {...register("sujet")}
                                    placeholder="Ex: Ajouter un rapport de ventes hebdomadaire"
                                    className="h-12 rounded-xl border-muted bg-muted/10 focus:bg-background transition-colors"
                                />
                                {errors.sujet && <p className="text-xs text-destructive ml-1">{errors.sujet.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                    Description détaillée
                                </Label>
                                <Textarea
                                    id="message"
                                    {...register("message")}
                                    placeholder="Dites-nous en plus sur votre besoin..."
                                    className="min-h-[120px] rounded-xl border-muted bg-muted/10 focus:bg-background transition-colors resize-none"
                                />
                                {errors.message && <p className="text-xs text-destructive ml-1">{errors.message.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="auteur" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                        Votre Nom (Optionnel)
                                    </Label>
                                    <Input
                                        id="auteur"
                                        {...register("auteur")}
                                        placeholder="Nom / Pseudo"
                                        className="h-12 rounded-xl border-muted bg-muted/10 focus:bg-background transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                        Votre Email (Optionnel)
                                    </Label>
                                    <Input
                                        id="email"
                                        {...register("email")}
                                        placeholder="email@exemple.com"
                                        className="h-12 rounded-xl border-muted bg-muted/10 focus:bg-background transition-colors"
                                    />
                                    {errors.email && <p className="text-xs text-destructive ml-1">{errors.email.message}</p>}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 flex gap-3 sm:gap-4">
                            <DialogClose asChild>
                                <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl text-base font-medium">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Envoyer l'idée <Send className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
