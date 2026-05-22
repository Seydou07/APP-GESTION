import 'dotenv/config'
// @ts-ignore
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Ensure DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

const pool = globalForPrisma.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' && 
       !process.env.DATABASE_URL.includes('localhost') && 
       !process.env.DATABASE_URL.includes('127.0.0.1') 
       ? { rejectUnauthorized: false } 
       : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const adapter = new PrismaPg(pool)

// This is the global "admin" client that can see all boutiques.
// WARNING: Do not use this in API routes where users should only see their own boutique.
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}

// Extension pour le Row-Level Security (Multi-tenant)
export const getPrismaUserClient = (boutiqueId: number) => {
  return prisma.$extends({
    name: 'MultiTenantExtension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // List of models that have a boutiqueId relation
          const tenantModels = [
            'User', 'Produit', 'Vente', 'VentePersistante', 'HistoriqueStock',
            'Depense', 'Employe', 'PaiementEmploye', 'Dette', 'PaiementDette', 'Suggestion'
          ];

          if (tenantModels.includes(model)) {
            // Determine if the operation is a read/update/delete operation that needs a `where` clause
            const needsWhereClause = ['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation);
            
            // Determine if the operation is a create operation that needs a `data` clause
            const needsDataClause = ['create', 'createMany'].includes(operation);

            const typedArgs = args as any;

            if (needsWhereClause) {
              typedArgs.where = { ...typedArgs.where, boutiqueId };
            }

            if (needsDataClause && typedArgs.data) {
              if (Array.isArray(typedArgs.data)) {
                typedArgs.data = typedArgs.data.map((d: any) => ({ ...d, boutiqueId }));
              } else {
                typedArgs.data = { ...typedArgs.data, boutiqueId };
              }
            }
          }

          return query(args);
        },
      },
    },
  });
};