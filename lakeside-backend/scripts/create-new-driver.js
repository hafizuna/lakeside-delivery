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

async function createNewDriver() {
  try {
    console.log('🚀 Creating new driver with correct phone format...\n');

    // Try different Ethiopian phone numbers until we find one that doesn't exist
    const possiblePhones = [
      '911223344',  // 9-digit Ethiopian
      '912345678',  // 9-digit Ethiopian  
      '913456789',  // 9-digit Ethiopian
      '914567890',  // 9-digit Ethiopian
      '915678901'   // 9-digit Ethiopian
    ];

    let availablePhone = null;
    let normalizedPhone = null;

    for (const phone of possiblePhones) {
      const normalized = normalizePhone(phone);
      console.log(`Testing ${phone} → ${normalized}`);
      
      const existingUser = await prisma.user.findUnique({
        where: { phone: normalized }
      });

      if (!existingUser) {
        availablePhone = phone;
        normalizedPhone = normalized;
        console.log(`✅ ${normalized} is available!`);
        break;
      } else {
        console.log(`❌ ${normalized} already exists (${existingUser.role})`);
      }
    }

    if (!availablePhone) {
      console.log('❌ All test phone numbers are taken. Using a random one...');
      const randomPhone = '91' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      availablePhone = randomPhone;
      normalizedPhone = normalizePhone(randomPhone);
      console.log(`🎲 Using random phone: ${randomPhone} → ${normalizedPhone}`);
    }

    // Driver account details
    const driverData = {
      name: 'Test Driver',
      phone: normalizedPhone, // Use the normalized format directly
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

    console.log('\n✅ New driver created successfully!');
    console.log(`
📱 DRIVER LOGIN CREDENTIALS (CORRECT FORMAT):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Phone: ${normalizedPhone}
🔐 Password: ${driverData.password}
🏍️ Vehicle: ${driverData.vehicleType} (${driverData.vehicleRegistration})
📄 License: ${driverData.licenseNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Role: DRIVER (not restaurant!)
✅ Status: APPROVED & ACTIVE
✅ Available for deliveries
✅ Wallet balance: ₹${result.wallet.balance}
✅ Collateral: ₹${result.wallet.collateralAmount}
⭐ Rating: ${result.driver.avgRating}/5.0
📦 Total deliveries: ${result.driver.totalDeliveries}

🎯 Copy and paste this EXACT phone number in the driver app!
    `);

    // Create some past earning transactions
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
    console.error('❌ Error creating new driver:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createNewDriver();
