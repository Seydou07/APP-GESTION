"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { settingsSchema } from "@/lib/validations"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette, Globe, Image as ImageIcon } from "lucide-react"

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
    })

    useEffect(() => {
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                reset(data)
                setFetching(false)
            })
            .catch(() => setFetching(false))
    }, [reset])

    const onSubmit = async (data: SettingsFormValues) => {
        setLoading(true)
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error("Erreur de sauvegarde")
            toast.success("Paramètres enregistrés avec succès")
            router.refresh() // <--- Trigger Layout refresh
        } catch (error) {
            toast.error("Erreur lors de l'enregistrement")
        } finally {
            setLoading(false)
        }
    }

    if (fetching) return <div className="p-10 text-center">Chargement des paramètres...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold">Paramètres de l'application</h2>
                    <p className="text-muted-foreground text-sm">
                        Gérez l'apparence et les informations générales de votre système.
                    </p>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card className="rounded-2xl shadow-sm border-none bg-background">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5" />
                                Général
                            </CardTitle>
                            <CardDescription>
                                Nom de l'application et Logo
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="appName">Nom de l'entreprise</Label>
                                <Input id="appName" {...register("appName")} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logoUrl">URL du Logo (ou Téléchargement)</Label>
                                <div className="flex gap-4">
                                    <Input id="logoUrl" {...register("logoUrl")} placeholder="https://..." className="rounded-xl flex-1" />
                                    <Button variant="outline" className="rounded-xl">
                                        <ImageIcon className="w-4 h-4 mr-2" />
                                        Upload
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm border-none bg-background">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Apparence
                            </CardTitle>
                            <CardDescription>
                                Personnalisez les couleurs du dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="themeColor">Couleur principale</Label>
                                <div className="flex gap-4 items-center">
                                    <Input id="themeColor" type="color" {...register("themeColor")} className="w-20 h-10 p-1 rounded-lg" />
                                    <span className="text-sm text-muted-foreground">Sélectionnez la couleur de base pour l'interface</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSubmit(onSubmit)} disabled={loading} className="rounded-xl px-8 py-6 text-lg">
                            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
