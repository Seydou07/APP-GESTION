import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Début du seeding...')

  const roles = ['ADMIN', 'VENDEUR', 'COMPTABLE', 'STOCK_MANAGER', 'ACHETEUR']
  const roleDescriptions = {
    ADMIN: 'Accès total à toutes les fonctionnalités',
    VENDEUR: 'Point de vente, ventes, clients, historique',
    COMPTABLE: 'Factures, dépenses, rapports financiers',
    STOCK_MANAGER: 'Inventaire, réception, transfert, stocks',
    ACHETEUR: 'Achats, stocks, fournisseurs'
  }
  const createdRoles = {}
  for (const name of roles) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description: roleDescriptions[name] },
      create: { name, description: roleDescriptions[name] }
    })
    createdRoles[name] = role
    console.log('Rôle créé:', role.name)
  }

  const store = await prisma.store.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Boutique Principale", address: "Abidjan, Côte d'Ivoire", phone: "0101010101", email: "contact@nexio.app" }
  })
  console.log('Magasin créé:', store.name)

  const adminEmail = 'admin@gmail.com'
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword, pseudo: 'Administrateur' },
    create: { pseudo: 'Administrateur', email: adminEmail, password: hashedPassword, isActive: true, storeId: 1 }
  })
  console.log('Admin créé:', admin.email)

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: createdRoles['ADMIN'].id } },
    update: {},
    create: { userId: admin.id, roleId: createdRoles['ADMIN'].id }
  })
  console.log('Rôle ADMIN assigné')

  await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Boutique", address: "Abidjan, Côte d'Ivoire", storeId: 1 }
  })
  console.log('Entrepôt Boutique créé')

  await prisma.warehouse.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: "Magasin / Réserve", address: "Abidjan, Côte d'Ivoire", storeId: 1 }
  })
  console.log('Magasin/Réserve créé')

  const expenseCategories = ['Loyer', 'Eau/Électricité', 'Transport', 'Fournitures', 'Nourriture', 'Nettoyage', 'Publicité', 'Assurance', 'Impôts', 'Salaire', 'Commission', 'Autre']
  for (let i = 0; i < expenseCategories.length; i++) {
    await prisma.expenseCategory.upsert({
      where: { id: i + 1 },
      update: { name: expenseCategories[i] },
      create: { id: i + 1, name: expenseCategories[i] }
    })
  }
  console.log('Catégories de dépenses créées')

  await prisma.appSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, appName: "Nexio", logoUrl: null, themeColor: "#3C91E6" }
  })
  console.log('Paramètres créés')

  console.log('Seeding terminé avec succès.')
}

main()
  .catch((e) => {
    console.error('Erreur durant le seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
