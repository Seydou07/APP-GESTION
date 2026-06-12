require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding...');

  // 1. Créer les rôles
  const roles = ['ADMIN', 'VENDEUR', 'COMPTABLE', 'STOCK_MANAGER', 'ACHETEUR'];
  const roleDescriptions = {
    ADMIN: 'Accès total à toutes les fonctionnalités',
    VENDEUR: 'Point de vente, ventes, clients, historique',
    COMPTABLE: 'Factures, dépenses, rapports financiers',
    STOCK_MANAGER: 'Inventaire, réception, transfert, stocks',
    ACHETEUR: 'Achats, stocks, fournisseurs'
  };
  const createdRoles = {};
  for (const name of roles) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { description: roleDescriptions[name] },
      create: { name, description: roleDescriptions[name] }
    });
    createdRoles[name] = role;
    console.log(`Rôle créé: ${role.name}`);
  }

  // 2. Créer le magasin principal
  const store = await prisma.store.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Boutique Principale",
      address: "Abidjan, Côte d'Ivoire",
      phone: "0101010101",
      email: "contact@nexio.app"
    }
  });
  console.log('Magasin créé:', store.name);

  // 3. Créer l'utilisateur admin
  const adminEmail = 'admin@gmail.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      pseudo: 'Administrateur'
    },
    create: {
      pseudo: 'Administrateur',
      email: adminEmail,
      password: hashedPassword,
      isActive: true,
      storeId: 1
    }
  });
  console.log('Admin créé:', admin.email);

  // 4. Assigner le rôle ADMIN à l'utilisateur admin
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: createdRoles['ADMIN'].id } },
    update: {},
    create: {
      userId: admin.id,
      roleId: createdRoles['ADMIN'].id
    }
  });
  console.log('Rôle ADMIN assigné');

  // 5. Créer l'entrepôt principal (Boutique)
  const warehouse1 = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Boutique",
      address: "Abidjan, Côte d'Ivoire",
      storeId: 1
    }
  });
  console.log('Entrepôt créé:', warehouse1.name);

  // 6. Créer le magasin/réserve
  const warehouse2 = await prisma.warehouse.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Magasin / Réserve",
      address: "Abidjan, Côte d'Ivoire",
      storeId: 1
    }
  });
  console.log('Magasin/réserve créé:', warehouse2.name);

  // 7. Créer les catégories de dépenses
  const expenseCategories = [
    'Loyer', 'Eau/Électricité', 'Transport', 'Fournitures',
    'Nourriture', 'Nettoyage', 'Publicité', 'Assurance',
    'Impôts', 'Salaire', 'Commission', 'Autre'
  ];
  for (const name of expenseCategories) {
    const index = expenseCategories.indexOf(name) + 1;
    await prisma.expenseCategory.upsert({
      where: { id: index },
      update: { name },
      create: { id: index, name }
    });
  }
  console.log('Catégories de dépenses créées');

  // 8. Créer les paramètres app
  await prisma.appSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      appName: "Nexio",
      logoUrl: null,
      themeColor: "#3C91E6"
    }
  });
  console.log('Paramètres créés');

  console.log('Seeding terminé avec succès.');
}

main()
  .catch((e) => {
    console.error('Erreur durant le seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
