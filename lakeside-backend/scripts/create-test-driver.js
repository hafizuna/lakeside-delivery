const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestDriver() {
  try {
    console.log('🚀 Creating test driver account...');

    // Driver account details
    const driverData = {
      name: 'Rajesh Kumar',
      phone: '9876543210',
      password: 'driver123',
      vehicleType: 'BIKE',
      licenseNumber: 'DL1420110012345',
      vehicleRegistration: 'HR01AB1234'
    };

    // Hash password
    const hashedPassword = await bcryptjs.hash(driverData.password, 10);

    // Create user and driver profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with DRIVER role
      const newUser = await tx.user.create({
        data: {
          name: driverData.name,
          phone: driverData.phone,
          passwordHash: hashedPassword,
          role: 'DRIVER',
          status: 'ACTIVE' // ✅ Already active
        }
      });

      // Create driver profile
      const newDriver = await tx.driver.create({
        data: {
          id: newUser.id,
          vehicleType: driverData.vehicleType,
          licenseNumber: driverData.licenseNumber,
          vehicleRegistration: driverData.vehicleRegistration,
          approvalStatus: 'APPROVED', // ✅ Already approved
          isAvailable: true,          // ✅ Available for deliveries
          avgRating: 4.8,            // Good rating
          totalDeliveries: 25,       // Some experience
          completionRate: 98.5       // High completion rate
        }
      });

      // Create driver wallet
      const driverWallet = await tx.driverWallet.create({
        data: {
          driverId: newUser.id,
          balance: 150.00,           // Some initial balance
          totalEarnings: 2500.00,    // Past earnings
          collateralAmount: 2000.00, // Collateral deposited
          canWithdraw: true,         // ✅ Can withdraw
          minCollateral: 1000.00
        }
      });

      return { user: newUser, driver: newDriver, wallet: driverWallet };
    });

    console.log('✅ Test driver created successfully!');
    console.log(`
📱 DRIVER LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Phone: ${driverData.phone}
🔐 Password: ${driverData.password}
🏍️ Vehicle: ${driverData.vehicleType} (${driverData.vehicleRegistration})
📄 License: ${driverData.licenseNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Status: APPROVED & ACTIVE
✅ Available for deliveries
✅ Wallet balance: ₹${result.wallet.balance}
✅ Collateral: ₹${result.wallet.collateralAmount}
⭐ Rating: ${result.driver.avgRating}/5.0
📦 Total deliveries: ${result.driver.totalDeliveries}

🎯 Ready to use in driver app!
    `);

  } catch (error) {
    console.error('❌ Error creating test driver:', error);
    
    if (error.code === 'P2002') {
      console.log(`
⚠️ Driver with phone ${driverData.phone} already exists!

To use existing driver:
👤 Phone: ${driverData.phone}
🔐 Password: ${driverData.password}
      `);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestDriver();
