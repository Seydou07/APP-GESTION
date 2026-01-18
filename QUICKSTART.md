# 🚀 Quickstart — KM BOMI (Next.js + Prisma + Shadcn)
admin@kmbomi.com
admin123

Bienvenue ! Ce fichier réunit les commandes, extraits de code et bonnes pratiques dont vous aurez besoin pour développer et déployer rapidement l'application.

---

## 🧰 Pré-requis

- Node.js >= 18 (recommandé)
- npm ou pnpm
- Compte Supabase / Neon / PlanetScale (ou PostgreSQL/MariaDB local)
- Git

---

## 🔧 Installation initiale

1. Ouvrir le projet

2. Installer dépendances :

```bash
npm install
```

3. Variables d'environnement (créez `.env.local`) — exemple minimal :

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/kmbomi?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere-avec-openssl"
```

> 💡 En prod (Vercel) remplacez par votre connection string DB et générez un NEXTAUTH_SECRET sécurisé.

---

## 🗄️ Prisma (ORM)

Fichiers principaux : `prisma/schema.prisma`

Commandes utiles :

```bash
# Générer le client Prisma
npx prisma generate

# Créer et appliquer migration (développement)
npx prisma migrate dev --name init

# Lancer Prisma Studio (interface graphique de la DB)
npx prisma studio
```

Exemple `lib/prisma.ts` :

```ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Exemple CRUD (TypeScript) :

```ts
// GET all products
export async function getProducts() {
  return await prisma.produit.findMany({ orderBy: { id: "asc" } });
}

// CREATE product
export async function createProduct(data: {
  designation: string;
  prix: number;
  quantite: number;
}) {
  return await prisma.produit.create({
    data: {
      designation: data.designation,
      prixUnitaire: data.prix,
      quantite: data.quantite,
    },
  });
}
```

---

## 📡 API Routes (App Router - route handlers)

Exemple `app/api/products/route.ts` :

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const produits = await prisma.produit.findMany();
  return NextResponse.json(produits);
}

export async function POST(request: Request) {
  const body = await request.json();
  // Validation (Zod) recommandée ici
  const produit = await prisma.produit.create({ data: body });
  return NextResponse.json(produit, { status: 201 });
}
```

> ✅ Pratique : valider toutes les entrées côté serveur (Zod) et renvoyer des codes HTTP appropriés.

---

## 🛡️ Authentification (NextAuth / Auth.js)

- Installer : `npm install next-auth @next-auth/prisma-adapter bcrypt`
- Exemple minimal `app/api/auth/[...nextauth]/route.ts` (Credential provider pour démarrer)

```ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { type: "text" }, password: { type: "password" } },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });
        // compare password (bcrypt)
        return user ?? null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
```

---

## 🎨 UI - Shadcn + Tailwind

- Installer Shadcn (déjà initialisé dans ce projet) :
  - `npx shadcn@latest init`
  - `npx shadcn@latest add button input card table sidebar chart sonner`

- Exemple d'utilisation d'un component :

```tsx
import { Button } from "@/components/ui/button";
export default function Page() {
  return <Button>Cliquer</Button>;
}
```

- Theme & Dark mode : utilisez `next-themes` et `ThemeProvider` comme indiqué dans la doc shadcn.

---

## ✅ Validation & Schémas (Zod)

Exemple `lib/validations.ts` :

```ts
import { z } from "zod";
export const productSchema = z.object({
  designation: z.string().min(1),
  prixUnitaire: z.number().positive(),
  quantite: z.number().int().nonnegative(),
});
```

Dans votre route API :

```ts
const parsed = productSchema.safeParse(body);
if (!parsed.success)
  return NextResponse.json({ error: parsed.error }, { status: 422 });
```

---

## 🧪 Dev & utilitaires

- Lancer le serveur dev : `npm run dev`
- Build : `npm run build`
- Lint : `npm run lint`

---

## 🛫 Déploiement (Vercel)

1. Pousser le repository sur GitHub
2. Depuis Vercel, créer un nouveau projet et relier le repo
3. Configurer les variables d'environnement (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
4. Déployer — Vercel exécutera `npm run build`

---

## 🔁 Migration depuis MySQL (notes rapides)

- Export MySQL : `mysqldump --single-transaction --quick --add-drop-table dbname > dump.sql`
- Convertir vers Postgres : utiliser `pgloader` (ou scripts python/node), ou migrer directement via CSV et `COPY` dans Postgres
- Vérifier les encodages et les contraintes (unique, auto-increment -> sequences)

---

## 🔧 Extraits pratiques utiles

- Rebuild Prisma après changement de schema : `npx prisma generate && npx prisma migrate dev --name <desc>`
- Ouvrir la DB dans Prisma Studio : `npx prisma studio`
- Exécuter une requête test dans `app/` (Server Component) :

```tsx
// app/dashboard/page.tsx (server)
import { prisma } from "@/lib/prisma";
export default async function Page() {
  const totalVentes = await prisma.vente.aggregate({ _sum: { total: true } });
  return <div>Vente Total: {totalVentes._sum.total ?? 0}</div>;
}
```

---

## 🧾 Conseils et bonnes pratiques

- Ne stockez pas vos secrets dans le repo. Utilisez `.env.local` en dev et variables d'environnement sur Vercel.
- Validez côté serveur et côté client (Zod + schemas TS).
- Ecrire des tests unitaires (Vitest) pour la logique métier critique (vente, stock, sécurité).
- Sauvegarder des backups réguliers de la base.

---

## 📌 Ressources

- Next.js docs: https://nextjs.org/docs
- Shadcn/ui docs: https://ui.shadcn.com
- Prisma docs: https://www.prisma.io/docs

---

> Si tu veux, je peux ajouter des snippets pour :
>
> - NextAuth complet + adapter Prisma
> - Routes API complètes CRUD
> - Composants UI Shadcn déjà prêts pour Produits / Ventes

Demande simplement : **"Ajoute les snippets Auth / API / UI maintenant"** et je les génère dans le projet.
