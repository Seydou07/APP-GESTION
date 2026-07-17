const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tables = await prisma.$queryRawUnsafe(`SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'nexio'`);
    for (const table of tables) {
        await prisma.$executeRawUnsafe(`REPAIR TABLE nexio.${table.TABLE_NAME};`);
        console.log(`Repaired ${table.TABLE_NAME}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
