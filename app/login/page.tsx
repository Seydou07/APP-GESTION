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
import { Loader2, Eye, EyeOff, ShoppingBag } from "lucide-react"
import Image from "next/image"

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

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
                if (result.error === "CredentialsSignin") {
                    toast.error("Identifiants incorrects")
                } else {
                    toast.error("Erreur de connexion au serveur")
                    console.error("Auth Error:", result.error)
                }
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
        <div className="min-h-screen flex items-stretch font-sans bg-background">
            {/* Left Section: Branding & Illustration */}
            <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                        alt="Entrepôt"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Dark Overlay for better text readability */}
                    <div className="absolute inset-0 bg-[#1E3A8A]/70" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-white mb-12">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">Nexio</span>
                    </div>

                    <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight">
                        Simplifiez la <br />
                        <span className="text-white/80">gestion avec votre</span> <br />
                        tableau de bord.
                    </h1>
                    <p className="text-white/70 mt-6 text-xl max-w-md border-l-2 border-white/30 pl-6">
                        Gérez vos stocks, vos ventes et vos employés avec une interface intuitive conçue pour votre succès.
                    </p>
                </div>
            </div>

            {/* Right Section: Login Form */}
            <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-24 xl:px-32 py-12 relative">
                <div className="w-full max-w-md mx-auto space-y-10">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-12 h-12 bg-[#1E3A8A] rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <ShoppingBag className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-[#1E3A8A]">Nexio</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-extrabold tracking-tight">Bienvenue</h2>
                        <p className="text-muted-foreground text-lg">
                            Veuillez vous connecter à votre compte.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Adresse Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="votre@email.com"
                                className="h-14 rounded-2xl border-muted bg-muted/20 focus-visible:ring-primary text-base px-6 transition-all"
                                {...register("email")}
                            />
                            {errors.email && (
                                <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-destructive rounded-full" /> {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mot de passe</Label>
                                <button type="button" className="text-sm font-bold text-primary hover:underline">Oublié ?</button>
                            </div>
                            <div className="relative group">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-14 rounded-2xl border-muted bg-muted/20 focus-visible:ring-primary text-base px-6 pr-14 transition-all"
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs font-medium text-destructive mt-1 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-destructive rounded-full" /> {errors.password.message}
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 text-white active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    Chargement...
                                </>
                            ) : (
                                "Se connecter"
                            )}
                        </Button>
                    </form>

                    <div className="pt-8 text-center border-t">
                        <p className="text-muted-foreground font-medium">
                            Vous n'avez pas encore de compte ? <br />
                            <a
                                href="https://soumaila-savadogo.omnia-elearning.com/contact/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-black hover:underline"
                            >
                                Contactez un administrateur
                            </a>
                        </p>
                    </div>
                </div>

                {/* Responsive Footer */}
                <div className="mt-auto pt-10 text-center text-xs text-muted-foreground lg:text-left">
                    &copy; 2026 Nexio. Tous droits réservés.
                </div>
            </div>
        </div>
    )
}
