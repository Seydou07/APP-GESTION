import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export const getPrismaStoreClient = (storeId: number) => {
  return prisma.$extends({
    name: 'MultiTenantExtension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantModels = [
            'User', 'Product', 'Category', 'ProductPrice',
            'Client', 'Supplier',
            'Sale', 'SaleItem', 'SalesOrder', 'SalesOrderItem',
            'Invoice', 'Ticket',
            'CustomerDebt', 'DebtPayment',
            'Expense', 'ExpenseCategory',
            'CashMovement',
            'Warehouse', 'StockLevel', 'StockMovement',
            'Employee', 'EmployeePayment',
            'PurchaseOrder', 'PurchaseOrderItem',
            'PurchaseReceipt', 'PurchaseReceiptItem',
            'PurchaseInvoice', 'PurchaseInvoiceItem',
            'Suggestion', 'ActivityLog', 'StockHistory',
          ]

          if (tenantModels.includes(model)) {
            const needsWhereClause = ['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)
            const needsDataClause = ['create', 'createMany'].includes(operation)

            const typedArgs = args as any

            if (needsWhereClause) {
              typedArgs.where = { ...typedArgs.where, storeId }
            }

            if (needsDataClause && typedArgs.data) {
              if (Array.isArray(typedArgs.data)) {
                typedArgs.data = typedArgs.data.map((d: any) => ({ ...d, storeId }))
              } else {
                typedArgs.data = { ...typedArgs.data, storeId }
              }
            }
          }

          return query(args)
        },
      },
    },
  })
}
