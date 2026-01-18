"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema } from "@/lib/validations"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, LogIn } from "lucide-react"

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })

    async function onSubmit(data: LoginFormValues) {
        setLoading(true)
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                toast.error("Identifiants invalides")
            } else {
                toast.success("Connexion réussie")
                router.push("/")
                router.refresh()
            }
        } catch (error) {
            toast.error("Une erreur est survenue")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md bg-background p-8 rounded-3xl shadow-xl border">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-primary mb-4">
                        <LogIn size={32} />
                    </div>
                    <h1 className="text-3xl font-bold">K.M.BOMI</h1>
                    <p className="text-muted-foreground mt-2 text-center">
                        Connectez-vous pour accéder à votre espace de gestion.
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="votre@email.com"
                            className="rounded-xl border-muted ring-offset-background focus-visible:ring-primary"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="rounded-xl border-muted ring-offset-background focus-visible:ring-primary"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Connexion en cours...
                            </>
                        ) : (
                            "Se connecter"
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-8">
                    Pas encore de compte ?{" "}
                    <span className="text-primary font-semibold cursor-pointer hover:underline">
                        Contactez un administrateur
                    </span>
                </p>
            </div>
        </div>
    )
}
