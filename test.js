const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Catalogues:', await prisma.catalogue.findMany());
  console.log('Categories:', await prisma.category.findMany());
  console.log('Products:', await prisma.product.findMany({take: 3}));
}

main().finally(() => prisma.$disconnect());
