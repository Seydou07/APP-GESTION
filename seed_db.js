require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seeding...');

  // 1. Create Default Boutique
  const boutique = await prisma.boutique.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nom: "Boutique Principale",
      adresse: "Abidjan, Côte d'Ivoire",
      telephone: "0101010101"
    }
  });
  console.log('Boutique created/updated:', boutique.nom);

  // 2. Create Admin User
  const adminEmail = 'admin@kmbomi.com';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      pseudo: 'Administrateur',
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      boutiqueId: 1
    }
  });

  console.log('Admin user created/updated:', admin.email);
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
