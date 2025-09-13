const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '../.env' });

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        status: true,
      }
    });
    
    console.log('📊 Found users:');
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.phone}) - ${user.role} - ${user.status}`);
    });
    
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      }
    });
    
    console.log('🏪 Found restaurants:');
    restaurants.forEach(restaurant => {
      console.log(`   - ${restaurant.name} (ID: ${restaurant.id}) - ${restaurant.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
