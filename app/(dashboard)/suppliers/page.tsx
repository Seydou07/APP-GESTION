"use client"

import { useEffect, useState } from "react"
import { Search, BookUser, Plus, Pencil, Trash2, Loader2, Phone, Mail, MapPin, FileText, ShoppingCart, AlertTriangle } from "lucide-react"
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
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
    })

    const [editFormData, setEditFormData] = useState({
        id: 0,
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
    })

    useEffect(() => { fetchSuppliers() }, [])

    const fetchSuppliers = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/suppliers")
            if (res.ok) {
                const data = await res.json()
                setSuppliers(data)
            }
        } catch (error) {
            toast.error("Erreur lors du chargement des fournisseurs")
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch("/api/suppliers", {
                method: "POST",
                body: JSON.stringify(formData)
            })
            if (!res.ok) {
                const err = await res.text()
                throw new Error(err || "Erreur lors de la création")
            }
            toast.success("Fournisseur créé avec succès")
            fetchSuppliers()
            setIsAddDialogOpen(false)
            setFormData({ name: "", phone: "", email: "", address: "", notes: "" })
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
            const res = await fetch("/api/suppliers", {
                method: "PATCH",
                body: JSON.stringify(editFormData)
            })
            if (!res.ok) {
                const err = await res.text()
                throw new Error(err || "Erreur lors de la modification")
            }
            toast.success("Fournisseur mis à jour")
            fetchSuppliers()
            setIsEditDialogOpen(false)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch("/api/suppliers", {
                method: "DELETE",
                body: JSON.stringify({ id })
            })
            if (!res.ok) {
                const err = await res.text()
                throw new Error(err || "Erreur lors de la suppression")
            }
            toast.success("Fournisseur supprimé")
            fetchSuppliers()
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const openEditModal = (supplier: any) => {
        setEditFormData({
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone || "",
            email: supplier.email || "",
            address: supplier.address || "",
            notes: supplier.notes || "",
        })
        setIsEditDialogOpen(true)
    }

    const filteredSuppliers = suppliers.filter((s: any) => {
        const searchLower = searchTerm.toLowerCase()
        const nameLower = (s.name ?? "").toLowerCase()
        const emailLower = (s.email ?? "").toLowerCase()
        const phone = s.phone ?? ""
        
        return nameLower.includes(searchLower) || emailLower.includes(searchLower) || phone.includes(searchTerm)
    })

    const totalSuppliers = suppliers.length

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Gestion des Fournisseurs</h2>
                    <p className="text-muted-foreground">Gérez vos fournisseurs et partenaires.</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl font-bold gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
                            <Plus className="w-4 h-4" />
                            Nouveau Fournisseur
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Ajouter un Fournisseur</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <Label>Nom complet *</Label>
                                <Input required placeholder="Ex: Distribution XYZ" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Téléphone</Label>
                                    <Input placeholder="+226 XX XX XX XX" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="rounded-xl" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input type="email" placeholder="contact@fournisseur.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="rounded-xl" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Adresse</Label>
                                <Input placeholder="Adresse" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Input placeholder="Notes éventuelles" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="rounded-xl" />
                            </div>
                            <Button type="submit" disabled={submitting} className="w-full rounded-xl font-bold h-12 mt-2">
                                {submitting ? <Loader2 className="animate-spin mr-2" /> : "Créer le fournisseur"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-2xl shadow-none border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                            <BookUser className="w-4 h-4" />
                            Total Fournisseurs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-black">{totalSuppliers}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-background rounded-3xl shadow-sm border p-8 space-y-8">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input placeholder="Rechercher par nom, téléphone ou email..." className="pl-12 h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="rounded-2xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent uppercase text-[10px] font-black tracking-widest text-muted-foreground">
                                <TableHead className="pl-8 py-5">Fournisseur</TableHead>
                                <TableHead className="py-5">Contact</TableHead>
                                <TableHead className="py-5 text-center">Commandes</TableHead>
                                <TableHead className="py-5">Date</TableHead>
                                <TableHead className="text-right pr-8 py-5">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
                                        Chargement...
                                    </TableCell>
                                </TableRow>
                            ) : filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                        Aucun fournisseur trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : filteredSuppliers.map((supplier: any) => (
                                <TableRow key={supplier.id} className="hover:bg-muted/10 transition-colors group">
                                    <TableCell className="pl-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                                                {supplier.name.substring(0, 1).toUpperCase()}
                                            </div>
                                            <p className="font-bold text-sm tracking-tight">{supplier.name}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                            {supplier.phone && <span className="flex items-center gap-1"><Phone size={12} />{supplier.phone}</span>}
                                            {supplier.email && <span className="flex items-center gap-1"><Mail size={12} />{supplier.email}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-center">
                                        <span className="inline-flex items-center gap-1 text-xs font-bold">
                                            <ShoppingCart size={12} />
                                            {supplier._count?.purchaseOrders || 0}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-4 text-xs text-muted-foreground">
                                        {format(new Date(supplier.createdAt), "dd/MM/yyyy", { locale: fr })}
                                    </TableCell>
                                    <TableCell className="text-right pr-8 py-4 space-x-2">
                                        <Button size="icon" variant="ghost" onClick={() => openEditModal(supplier)} className="rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => { setSupplierToDelete(supplier.id); setIsConfirmOpen(true) }} className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Modifier le Fournisseur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 mt-4">
                        <div className="grid gap-2">
                            <Label>Nom complet</Label>
                            <Input required value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Téléphone</Label>
                                <Input value={editFormData.phone} onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })} className="rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input type="email" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} className="rounded-xl" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Adresse</Label>
                            <Input value={editFormData.address} onChange={e => setEditFormData({ ...editFormData, address: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Notes</Label>
                            <Input value={editFormData.notes} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })} className="rounded-xl" />
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
                title="Supprimer le fournisseur ?"
                description="Êtes-vous sûr de vouloir supprimer ce fournisseur ? Cette action est irréversible."
                icon={AlertTriangle}
                onConfirm={() => supplierToDelete && handleDelete(supplierToDelete)}
                confirmText="Oui, supprimer"
            />
        </div>
    )
}
