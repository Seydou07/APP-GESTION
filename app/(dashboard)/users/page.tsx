"use client"

import { useEffect, useState } from "react"
import { Plus, Search, User, Mail, Shield, Trash2, Loader2, UserPlus, AlertTriangle, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [userToEdit, setUserToEdit] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // Form states
    const [formData, setFormData] = useState({
        pseudo: "",
        email: "",
        password: "",
        role: "VENDEUR"
    })

    const [editFormData, setEditFormData] = useState({
        id: "",
        pseudo: "",
        email: "",
        password: "",
        role: "VENDEUR"
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/users")
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            toast.error("Erreur lors du chargement des utilisateurs")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error || "Erreur lors de la création")
            }

            toast.success("Utilisateur créé avec succès")
            fetchUsers()
            setIsAddDialogOpen(false)
            setFormData({ pseudo: "", email: "", password: "", role: "VENDEUR" })
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch("/api/users", {
                method: "PATCH",
                body: JSON.stringify(editFormData)
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error || "Erreur lors de la modification")
            }

            toast.success("Utilisateur mis à jour")
            fetchUsers()
            setIsEditDialogOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch("/api/users", {
                method: "DELETE",
                body: JSON.stringify({ id })
            })

            if (!res.ok) {
                const error = await res.text()
                throw new Error(error || "Erreur lors de la suppression")
            }

            toast.success("Utilisateur supprimé")
            fetchUsers()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const openEditModal = (user: any) => {
        setEditFormData({
            id: user.id,
            pseudo: user.pseudo,
            email: user.email,
            password: "", // Keep password empty unless changing
            role: user.role
        })
        setIsEditDialogOpen(true)
    }

    const filteredUsers = users.filter((u: any) =>
        u.pseudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestion des Utilisateurs</h2>
                    <p className="text-muted-foreground">Gérez les accès et les rôles de votre équipe.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                            <UserPlus className="w-4 h-4" />
                            Nouvel Utilisateur
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Ajouter un Membre</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <Label>Pseudo / Nom</Label>
                                <Input
                                    required
                                    placeholder="Ex: Jean Paul"
                                    value={formData.pseudo}
                                    onChange={e => setFormData({ ...formData, pseudo: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email de connexion</Label>
                                <Input
                                    required
                                    type="email"
                                    placeholder="email@exemple.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Mot de passe</Label>
                                <Input
                                    required
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Rôle</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={v => setFormData({ ...formData, role: v })}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="VENDEUR">Vendeur (Accès limité)</SelectItem>
                                        <SelectItem value="ADMIN">Administrateur (Accès total)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" disabled={submitting} className="w-full rounded-xl font-bold h-12 mt-2">
                                {submitting ? <Loader2 className="animate-spin mr-2" /> : "Créer le compte"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-background rounded-3xl shadow-sm border p-8 space-y-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom ou email..."
                        className="pl-12 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="rounded-2xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                <TableHead className="pl-8 py-5">Utilisateur</TableHead>
                                <TableHead className="py-5">Rôle</TableHead>
                                <TableHead className="py-5">Date Création</TableHead>
                                <TableHead className="text-right pr-8 py-5">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
                                        Chargement de la liste...
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                                        Aucun utilisateur trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.map((user: any) => (
                                <TableRow key={user.id} className="hover:bg-muted/10 transition-colors group">
                                    <TableCell className="pl-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                                                {user.pseudo.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight">{user.pseudo}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                                                    <Mail size={12} />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            user.role === "ADMIN"
                                                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                                                : "bg-muted text-muted-foreground border border-muted-foreground/10"
                                        )}>
                                            <Shield size={10} strokeWidth={3} />
                                            {user.role}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-xs font-medium text-muted-foreground">
                                        {format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="text-right pr-8 py-4 space-x-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openEditModal(user)}
                                            className="rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                setUserToDelete(user.id)
                                                setIsConfirmOpen(true)
                                            }}
                                            className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Modifier l'Utilisateur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                        <div className="grid gap-2">
                            <Label>Pseudo / Nom</Label>
                            <Input
                                required
                                placeholder="Ex: Jean Paul"
                                value={editFormData.pseudo}
                                onChange={e => setEditFormData({ ...editFormData, pseudo: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email de connexion</Label>
                            <Input
                                required
                                type="email"
                                placeholder="email@exemple.com"
                                value={editFormData.email}
                                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Nouveau mot de passe (laisser vide si inchangé)</Label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={editFormData.password}
                                onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Rôle</Label>
                            <Select
                                value={editFormData.role}
                                onValueChange={v => setEditFormData({ ...editFormData, role: v })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="VENDEUR">Vendeur (Accès limité)</SelectItem>
                                    <SelectItem value="ADMIN">Administrateur (Accès total)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full rounded-xl font-bold h-12 mt-2">
                            {submitting ? <Loader2 className="animate-spin mr-2" /> : "Enregistrer les modifications"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Supprimer l'utilisateur ?"
                description="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera tout accès au système."
                icon={AlertTriangle}
                onConfirm={() => userToDelete && handleDelete(userToDelete)}
                confirmText="Oui, supprimer"
            />
        </div>
    )
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}
