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
    items: z.array(z.object({
        produitId: z.number().min(1, "Produit requis"),
        quantite: z.number().min(1, "La quantité doit être d'au moins 1"),
        designation: z.string().optional(),
        prixUnitaire: z.number().optional(),
    })).min(1, "Le panier doit contenir au moins un produit"),
    nomClient: z.string().optional(),
    prenomClient: z.string().optional(),
    numeroClient: z.string().optional(),
});

export const settingsSchema = z.object({
    appName: z.string().min(2),
    logoUrl: z.string().url().optional().or(z.literal("")),
});

export const suggestionSchema = z.object({
    sujet: z.string().min(3, "Le sujet doit faire au moins 3 caractères"),
    message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
    auteur: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
});
