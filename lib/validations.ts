import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const productSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    code: z.string().min(1, "Le code est requis"),
    name: z.string().min(2, "La désignation est requise"),
    salePrice: z.coerce.number().min(0, "Le prix doit être positif"),
    costPrice: z.coerce.number().min(0, "Le prix de revient doit être positif").default(0),
    unit: z.string().default("pièce"),
    categoryId: z.coerce.number().optional(),
    stockMin: z.coerce.number().min(0).default(5),
    description: z.string().optional(),
});

export const categorySchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(2, "Le nom est requis"),
    description: z.string().optional(),
    parentId: z.coerce.number().optional(),
});

export const clientSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(2, "Le nom est requis"),
    phone: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    address: z.string().optional(),
    creditLimit: z.coerce.number().min(0).default(0),
});

export const supplierSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(2, "Le nom est requis"),
    phone: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    address: z.string().optional(),
    notes: z.string().optional(),
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

export const purchaseOrderSchema = z.object({
    supplierId: z.coerce.number().min(1, "Fournisseur requis"),
    deliveryDate: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.number().min(1, "Produit requis"),
        quantity: z.number().min(1),
        priceUnit: z.number().min(0),
        discount: z.coerce.number().default(0),
    })).min(1),
});

export const purchaseReceiptSchema = z.object({
    orderId: z.coerce.number().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        productId: z.number().min(1),
        quantity: z.number().min(1),
        priceUnit: z.number().min(0),
    })).min(1),
});

export const expenseSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    amount: z.coerce.number().min(1, "Le montant doit être positif"),
    categoryId: z.coerce.number().optional(),
    description: z.string().optional(),
    expenseDate: z.string().optional(),
    notes: z.string().optional(),
});

export const debtPaymentSchema = z.object({
    debtId: z.coerce.number().min(1),
    amount: z.coerce.number().min(1, "Le montant doit être positif"),
    method: z.string().optional(),
    note: z.string().optional(),
});

export const settingsSchema = z.object({
    appName: z.string().min(2),
    logoUrl: z.string().url().optional().or(z.literal("")),
    themeColor: z.string().optional(),
});

export const suggestionSchema = z.object({
    sujet: z.string().min(3, "Le sujet doit faire au moins 3 caractères"),
    message: z.string().min(10, "Le message doit faire au moins 10 caractères"),
    auteur: z.string().optional(),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
});

export const warehouseSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(2, "Le nom est requis"),
    address: z.string().optional(),
});

export const employeeSchema = z.object({
    id: z.union([z.string(), z.number()]).optional(),
    firstName: z.string().min(1, "Le prénom est requis"),
    lastName: z.string().min(1, "Le nom est requis"),
    position: z.string().optional(),
    phone: z.string().optional(),
    salaryBase: z.coerce.number().min(0, "Le salaire doit être positif"),
});
