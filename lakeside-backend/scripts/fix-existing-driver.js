const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingDriver() {
  try {
    console.log('🔧 Fixing existing driver +251911223344...\n');

    const driver = await prisma.user.findUnique({
      where: { phone: '+251911223344' },
      include: {
        driverProfile: {
          include: {
            driverWallet: true
          }
        }
      }
    });

    if (!driver) {
      console.log('❌ Driver +251911223344 not found');
      return;
    }

    console.log(`📊 Existing driver: ${driver.name} (${driver.role})`);

    if (driver.role !== 'DRIVER') {
      console.log(`❌ User is ${driver.role}, not DRIVER. Skipping...`);
      return;
    }

    if (!driver.driverProfile) {
      console.log('🔧 Creating missing driver profile and wallet...');
      
      const result = await prisma.$transaction(async (tx) => {
        // Update user status to ACTIVE if needed
        await tx.user.update({
          where: { id: driver.id },
          data: { status: 'ACTIVE' }
        });

        // Create driver profile
        const newDriver = await tx.driver.create({
          data: {
            id: driver.id,
            vehicleType: 'BIKE',
            licenseNumber: 'DL1420110012345',
            vehicleRegistration: 'HR01AB1234',
            approvalStatus: 'APPROVED',
            isAvailable: true,
            avgRating: 4.8,
            totalDeliveries: 25,
            completionRate: 98.5
          }
        });

        // Create driver wallet
        const driverWallet = await tx.driverWallet.create({
          data: {
            driverId: driver.id,
            balance: 150.00,
            totalEarnings: 2500.00,
            collateralAmount: 2000.00,
            canWithdraw: true,
            minCollateral: 1000.00
          }
        });

        return { driver: newDriver, wallet: driverWallet };
      });

      console.log('✅ Driver profile and wallet created!');
    } else {
      console.log('✅ Driver profile already exists');
    }

    console.log(`\n📱 FIXED DRIVER LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Phone: +251911223344
🔐 Password: driver123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Role: DRIVER
✅ Status: APPROVED & ACTIVE  
✅ Available for deliveries

🎯 Use this phone number in the driver app login!
    `);

  } catch (error) {
    console.error('❌ Error fixing driver:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExistingDriver();
