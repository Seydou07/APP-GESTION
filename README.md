# APP-GESTION

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

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
