const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL n\'est pas définie dans .env');
    process.exit(1);
}

console.log('📡 Connexion à la base de données...');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        console.log('🔍 Vérification de la connexion...');
        await prisma.$connect();
        console.log('✅ Connexion réussie !');

        const adminEmail = 'admin@kmbomi.com';
        const adminPassword = 'admin123';
        const pseudo = 'Admin Bomi';

        // Hachage du mot de passe avec bcrypt
        console.log('🔐 Hachage du mot de passe...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        console.log('👤 Création de l\'utilisateur admin...');

        const user = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {},
            create: {
                email: adminEmail,
                pseudo: pseudo,
                password: hashedPassword,
                role: 'ADMIN',
            },
        });

        console.log(`\n✅ Utilisateur Admin créé avec succès !`);
        console.log(`📧 Email : ${adminEmail}`);
        console.log(`🔑 Mot de passe : ${adminPassword}`);
        console.log(`👑 Rôle : ADMIN`);
    } catch (error) {
        console.error('❌ Erreur lors du seed :', error.message);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Erreur fatale :', e);
        process.exit(1);
    })
    .finally(async () => {
        console.log('🔌 Déconnexion...');
        await pool.end();
        await prisma.$disconnect();
    });
