const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

// Copy the normalizePhone function from validation.ts
function normalizePhone(phone) {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If no country code, assume Ethiopian (+251)
  if (!cleaned.startsWith('+')) {
    // If it starts with 0, remove the 0 and add +251
    if (cleaned.startsWith('0')) {
      cleaned = '+251' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      // If it's 9 digits (Ethiopian mobile without 0), add +251
      cleaned = '+251' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
      // If it's 10 digits starting with 9 (0922772024 -> 922772024), add +251
      cleaned = '+251' + cleaned;
    } else {
      // For other cases, add +251 prefix
      cleaned = '+251' + cleaned;
    }
  }
  
  return cleaned;
}

async function createDriverCorrectFormat() {
  try {
    console.log('🚀 Creating driver with correct phone format...');

    // Test different phone formats to see what the normalization produces
    const testPhones = [
      '9876543210',     // Indian format
      '0987654321',     // With leading 0
      '922772024',      // 9-digit Ethiopian
      '+919876543210'   // Full international
    ];

    console.log('📞 Testing phone normalization:');
    testPhones.forEach(phone => {
      const normalized = normalizePhone(phone);
      console.log(`${phone} → ${normalized}`);
    });

    // Use a phone that will normalize correctly
    const rawPhone = '922772024'; // 9-digit Ethiopian format
    const normalizedPhone = normalizePhone(rawPhone);
    
    console.log(`\n🔄 Using normalized phone: ${normalizedPhone}`);

    // Driver account details
    const driverData = {
      name: 'Rajesh Kumar',
      phone: normalizedPhone, // Use the normalized format directly
      password: 'driver123',
      vehicleType: 'BIKE',
      licenseNumber: 'DL1420110012345',
      vehicleRegistration: 'HR01AB1234'
    };

    // Hash password
    const hashedPassword = await bcryptjs.hash(driverData.password, 10);

    // Check if driver already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existingUser) {
      console.log(`⚠️  Driver with phone ${normalizedPhone} already exists!`);
      console.log(`
📱 USE EXISTING DRIVER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Phone: ${normalizedPhone}
🔐 Password: driver123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Use this normalized phone number in driver app login!
      `);
      return;
    }

    // Create user and driver profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user with DRIVER role
      const newUser = await tx.user.create({
        data: {
          name: driverData.name,
          phone: normalizedPhone, // Use normalized phone
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
📱 DRIVER LOGIN CREDENTIALS (CORRECT FORMAT):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Phone: ${normalizedPhone}
🔐 Password: ${driverData.password}
🏍️ Vehicle: ${driverData.vehicleType} (${driverData.vehicleRegistration})
📄 License: ${driverData.licenseNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Status: APPROVED & ACTIVE
✅ Available for deliveries
✅ Wallet balance: ₹${result.wallet.balance}
✅ Collateral: ₹${result.wallet.collateralAmount}
⭐ Rating: ${result.driver.avgRating}/5.0
📦 Total deliveries: ${result.driver.totalDeliveries}

🎯 Use the EXACT phone number above in the driver app!
    `);

    // Also create some past earning transactions
    const earningTransactions = [
      { amount: 45.00, description: 'Delivery #001 - Pizza Palace' },
      { amount: 38.00, description: 'Delivery #002 - Burger King' },
      { amount: 52.00, description: 'Delivery #003 - Chinese Corner' },
    ];

    for (const transaction of earningTransactions) {
      await prisma.walletTransaction.create({
        data: {
          driverId: result.user.id,
          amount: transaction.amount,
          type: 'DRIVER_EARNING',
          status: 'APPROVED',
          description: transaction.description,
          processedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24h
        }
      });
    }
    
    console.log('✅ Created earning history for driver');

  } catch (error) {
    console.error('❌ Error creating test driver:', error);
    
    if (error.code === 'P2002') {
      console.log(`
⚠️ Driver with normalized phone already exists!

Try checking existing drivers in database:
SELECT phone FROM users WHERE role = 'DRIVER';
      `);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createDriverCorrectFormat();
