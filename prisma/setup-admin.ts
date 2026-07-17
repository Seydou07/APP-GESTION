import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Setting up default admin user...');

  // Create or get the main store
  const store = await prisma.store.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Boutique Principale' },
  });

  // Create or get the ADMIN role
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrateur système' },
  });

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin123');
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      pseudo: 'Admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      storeId: store.id,
      isActive: true,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  console.log('✅ Default admin user created successfully!');
  console.log('📧 Email: admin@gmail.com');
  console.log('🔑 Password: admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
