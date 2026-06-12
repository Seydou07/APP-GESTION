const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkSettings() {
    try {
        const settings = await prisma.appSetting.findFirst();
        console.log('📊 Current Settings in DB:');
        console.log(JSON.stringify(settings, null, 2));

        if (!settings) {
            console.log('⚠️ No settings found in DB.');
        }
    } catch (error) {
        console.error('❌ Error fetching settings:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

checkSettings();
