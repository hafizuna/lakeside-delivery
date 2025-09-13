const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingUsers() {
  try {
    console.log('🔍 Checking existing users in database...\n');

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        driverProfile: {
          include: {
            driverWallet: true
          }
        }
      }
    });

    console.log(`📊 Total users: ${users.length}\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    // Group by role
    const customerUsers = users.filter(u => u.role === 'CUSTOMER');
    const driverUsers = users.filter(u => u.role === 'DRIVER');
    const restaurantUsers = users.filter(u => u.role === 'RESTAURANT');

    console.log('👥 CUSTOMERS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    customerUsers.forEach(user => {
      console.log(`📱 ${user.phone} | ${user.name} | ${user.status}`);
    });

    console.log('\n🚗 DRIVERS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    driverUsers.forEach(user => {
      const driver = user.driverProfile;
      console.log(`📱 ${user.phone} | ${user.name} | ${user.status} | ${driver?.approvalStatus || 'NO PROFILE'} | Available: ${driver?.isAvailable || false}`);
    });

    console.log('\n🍽️ RESTAURANTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    restaurantUsers.forEach(user => {
      console.log(`📱 ${user.phone} | ${user.name} | ${user.status}`);
    });

    // Show which drivers can be used for testing
    console.log('\n🎯 USABLE DRIVERS FOR TESTING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const usableDrivers = driverUsers.filter(user => 
      user.status === 'ACTIVE' && 
      user.driverProfile?.approvalStatus === 'APPROVED'
    );

    if (usableDrivers.length === 0) {
      console.log('❌ No approved and active drivers found');
      console.log('🔧 Need to create a new approved driver');
    } else {
      usableDrivers.forEach(user => {
        console.log(`✅ Phone: ${user.phone} | Password: driver123 | Name: ${user.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers();
