import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const productSchema = z.object({
    id: z.string().optional(),
    designation: z.string().min(2, "La désignation est requise"),
    prixUnitaire: z.coerce.number().min(0, "Le prix doit être positif"),
    quantite: z.coerce.number().min(0, "La quantité doit être positive"),
    categorie: z.string().optional(),
    seuilAlerte: z.coerce.number().default(5),
});

export const saleSchema = z.object({
    produitId: z.coerce.number().min(1, "Produit requis"),
    quantite: z.coerce.number().min(1, "La quantité doit être d'au moins 1"),
    nomClient: z.string().optional(),
    prenomClient: z.string().optional(),
    numeroClient: z.string().optional(),
});

export const settingsSchema = z.object({
    appName: z.string().min(2),
    logoUrl: z.string().url().optional().or(z.literal("")),
    themeColor: z.string().min(4),
});
