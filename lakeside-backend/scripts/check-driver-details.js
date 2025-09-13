const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDriverDetails() {
  try {
    console.log('🔍 Checking driver details...\n');

    // Check the +251922772024 driver
    const driver = await prisma.user.findUnique({
      where: { phone: '+251922772024' },
      include: {
        driverProfile: {
          include: {
            driverWallet: true
          }
        }
      }
    });

    if (!driver) {
      console.log('❌ Driver +251922772024 not found');
      return;
    }

    console.log(`📊 DRIVER ACCOUNT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Phone: ${driver.phone}
🔐 Name: ${driver.name}
📝 Role: ${driver.role}
📊 Status: ${driver.status}
`);

    if (!driver.driverProfile) {
      console.log('❌ No driver profile found for this user');
      console.log('🔧 This user exists but has no driver profile. Need to create profile...');
      
      // Create driver profile for this user
      const result = await prisma.$transaction(async (tx) => {
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
      console.log(`🚗 DRIVER PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏍️ Vehicle: ${driver.driverProfile.vehicleType} (${driver.driverProfile.vehicleRegistration})
📄 License: ${driver.driverProfile.licenseNumber}
✅ Approval: ${driver.driverProfile.approvalStatus}
🟢 Available: ${driver.driverProfile.isAvailable}
⭐ Rating: ${driver.driverProfile.avgRating}/5.0
📦 Deliveries: ${driver.driverProfile.totalDeliveries}
`);

      if (driver.driverProfile.driverWallet) {
        console.log(`💰 DRIVER WALLET:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Balance: ₹${driver.driverProfile.driverWallet.balance}
💰 Total Earnings: ₹${driver.driverProfile.driverWallet.totalEarnings}
🔒 Collateral: ₹${driver.driverProfile.driverWallet.collateralAmount}
✅ Can Withdraw: ${driver.driverProfile.driverWallet.canWithdraw}
`);
      }
    }

    console.log(`\n📱 FINAL DRIVER LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Phone: ${driver.phone}
🔐 Password: driver123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Use this EXACT phone number in the driver app login!
    `);

  } catch (error) {
    console.error('❌ Error checking driver details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDriverDetails();
