const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewPaymentFlow() {
  console.log('=== TESTING NEW COMPLETE PAYMENT FLOW ===\n');
  
  try {
    // 1. Check current state of wallets
    console.log('1. CHECKING INITIAL WALLET STATES:');
    
    // Get customer with wallet
    const customer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
      include: { customerWallet: true }
    });
    
    if (!customer) {
      console.log('❌ No customer found');
      return;
    }
    
    console.log(`Customer: ${customer.name} (${customer.phone})`);
    console.log(`Initial Balance: ₹${customer.customerWallet?.balance || 0}`);
    
    // Top up customer wallet if insufficient for test
    const currentBalance = customer.customerWallet?.balance.toNumber() || 0;
    const requiredBalance = 150; // Enough for our test order
    
    if (currentBalance < requiredBalance) {
      const topUpAmount = requiredBalance - currentBalance;
      console.log(`Topping up customer wallet by ₹${topUpAmount} for test...`);
      
      await prisma.customerWallet.upsert({
        where: { customerId: customer.id },
        create: {
          customerId: customer.id,
          balance: requiredBalance,
          totalTopUps: topUpAmount
        },
        update: {
          balance: { increment: topUpAmount },
          totalTopUps: { increment: topUpAmount }
        }
      });
      
      console.log(`✅ Customer balance updated to ₹${requiredBalance}`);
    }
    console.log('');
    
    // Get restaurant
    const restaurant = await prisma.restaurant.findFirst({
      include: {
        restaurantWallet: true,
        user: true
      }
    });
    
    if (!restaurant) {
      console.log('❌ No restaurant found');
      return;
    }
    
    console.log(`Restaurant: ${restaurant.name}`);
    console.log(`Commission Rate: ${restaurant.commissionRate}%`);
    console.log(`Initial Restaurant Balance: ₹${restaurant.restaurantWallet?.balance || 0}\n`);
    
    // Get driver
    const driver = await prisma.user.findFirst({
      where: { role: 'DRIVER' },
      include: { driverProfile: { include: { driverWallet: true } } }
    });
    
    if (!driver) {
      console.log('❌ No driver found');
      return;
    }
    
    console.log(`Driver: ${driver.name} (${driver.phone})`);
    console.log(`Initial Driver Balance: ₹${driver.driverProfile?.driverWallet?.balance || 0}\n`);
    
    // 2. Create a new test order
    console.log('2. CREATING NEW TEST ORDER:');
    
    const orderData = {
      customerId: customer.id,
      restaurantId: restaurant.id,
      totalPrice: 100.00, // ₹100 food
      deliveryFee: 20.00,  // ₹20 delivery
      deliveryAddress: '123 Test Street, Test City',
      deliveryLat: 34.0522,
      deliveryLng: -118.2437,
      paymentMethod: 'WALLET'
    };
    
    // Calculate expected values
    const totalOrderAmount = orderData.totalPrice + orderData.deliveryFee; // ₹120
    const expectedCommission = orderData.totalPrice * (restaurant.commissionRate.toNumber() / 100); // e.g., 15% of ₹100 = ₹15
    const expectedRestaurantEarning = orderData.totalPrice - expectedCommission; // ₹100 - ₹15 = ₹85
    const expectedDriverEarning = orderData.deliveryFee * 0.9; // 90% of ₹20 = ₹18
    const expectedPlatformCommission = orderData.deliveryFee * 0.1; // 10% of ₹20 = ₹2
    
    console.log('Expected calculations:');
    console.log(`- Total Order Amount: ₹${totalOrderAmount}`);
    console.log(`- Commission (${restaurant.commissionRate}%): ₹${expectedCommission}`);
    console.log(`- Restaurant Earning: ₹${expectedRestaurantEarning}`);
    console.log(`- Driver Earning (90%): ₹${expectedDriverEarning}`);
    console.log(`- Platform Commission (10%): ₹${expectedPlatformCommission}\\n`);
    
    // Create order via API-like transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          restaurantId: restaurant.id,
          driverId: driver.id, // Assign driver immediately for testing
          totalPrice: orderData.totalPrice,
          deliveryFee: orderData.deliveryFee,
          commission: expectedCommission,
          pickupAddress: restaurant.address,
          pickupLat: restaurant.lat,
          pickupLng: restaurant.lng,
          deliveryAddress: orderData.deliveryAddress,
          deliveryLat: orderData.deliveryLat,
          deliveryLng: orderData.deliveryLng,
          driverEarning: expectedDriverEarning,
          platformCommission: expectedPlatformCommission,
          paymentMethod: 'WALLET',
          paymentStatus: 'PENDING',
          status: 'DELIVERING' // Skip to delivering for testing
        }
      });
      
      // Create dummy order item
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          menuId: 1, // Assume menu item exists
          quantity: 2,
          price: 50.00
        }
      });
      
      return order;
    });
    
    console.log(`✅ Created test order #${newOrder.id}`);
    console.log(`Status: ${newOrder.status} | Payment: ${newOrder.paymentMethod} (${newOrder.paymentStatus})\\n`);
    
    // 3. Test the delivery endpoint (which should process all payments)
    console.log('3. SIMULATING ORDER DELIVERY (Payment Processing):');
    
    // Get order details with restaurant info (simulate the delivery endpoint logic)
    const orderToDeliver = await prisma.order.findFirst({
      where: {
        id: newOrder.id,
        driverId: driver.id,
        status: 'DELIVERING'
      },
      include: {
        restaurant: true,
        customer: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!orderToDeliver) {
      console.log('❌ Order not found for delivery');
      return;
    }
    
    // Import wallet services
    const walletService = require('./dist/services/walletService').default;
    const restaurantWalletService = require('./dist/services/restaurantWalletService').default;
    
    // Calculate amounts (same as delivery endpoint)
    const totalAmount = orderToDeliver.totalPrice.toNumber() + orderToDeliver.deliveryFee.toNumber();
    const commission = orderToDeliver.commission.toNumber();
    const restaurantEarning = orderToDeliver.totalPrice.toNumber() - commission;
    const driverEarning = orderToDeliver.driverEarning.toNumber();
    const platformCommission = orderToDeliver.platformCommission.toNumber();
    
    console.log('Processing payments...');
    
    // Process all payments in transaction (simulate delivery endpoint)
    const deliveryResult = await prisma.$transaction(async (tx) => {
      // Mark order as delivered
      const deliveredOrder = await tx.order.update({
        where: { id: orderToDeliver.id },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          paymentStatus: 'PAID'
        }
      });
      
      // Process customer wallet payment
      console.log('- Processing customer wallet payment...');
      const customerPayment = await walletService.processCustomerPayment(
        orderToDeliver.customerId,
        totalAmount,
        orderToDeliver.id
      );
      
      if (!customerPayment.success) {
        throw new Error(`Customer payment failed: ${customerPayment.message}`);
      }
      console.log(`  ✅ Customer charged ₹${totalAmount}`);
      
      // Credit restaurant wallet
      console.log('- Processing restaurant wallet credit...');
      const restaurantCredit = await restaurantWalletService.addRestaurantEarning(
        orderToDeliver.restaurantId,
        orderToDeliver.totalPrice.toNumber(),
        commission,
        orderToDeliver.id
      );
      
      if (!restaurantCredit.success) {
        throw new Error(`Restaurant credit failed: ${restaurantCredit.message}`);
      }
      console.log(`  ✅ Restaurant credited ₹${restaurantEarning} (₹${commission} commission deducted)`);
      
      // Credit driver wallet
      console.log('- Processing driver wallet credit...');
      const driverCredit = await walletService.addDriverEarning(driver.id, driverEarning, orderToDeliver.id);
      
      if (!driverCredit.success) {
        throw new Error(`Driver credit failed: ${driverCredit.message}`);
      }
      console.log(`  ✅ Driver credited ₹${driverEarning}`);
      
      return {
        order: deliveredOrder,
        customerPayment,
        restaurantCredit,
        driverCredit
      };
    });
    
    console.log('\\n✅ Order delivery and payment processing completed!\\n');
    
    // 4. Verify final wallet states
    console.log('4. FINAL WALLET VERIFICATION:');
    
    // Check customer wallet
    const updatedCustomerWallet = await prisma.customerWallet.findUnique({
      where: { customerId: customer.id }
    });
    console.log(`Customer Balance: ₹${updatedCustomerWallet?.balance || 0} (was ₹${customer.customerWallet?.balance || 0})`);
    
    // Check restaurant wallet
    const updatedRestaurantWallet = await prisma.restaurantWallet.findUnique({
      where: { restaurantId: restaurant.id }
    });
    console.log(`Restaurant Balance: ₹${updatedRestaurantWallet?.balance || 0} (was ₹${restaurant.restaurantWallet?.balance || 0})`);
    
    // Check driver wallet
    const updatedDriverWallet = await prisma.driverWallet.findUnique({
      where: { driverId: driver.driverProfile.id }
    });
    console.log(`Driver Balance: ₹${updatedDriverWallet?.balance || 0} (was ₹${driver.driverProfile?.driverWallet?.balance || 0})\\n`);
    
    // 5. Check transaction records
    console.log('5. TRANSACTION RECORDS:');
    
    const customerTransactions = await prisma.walletTransaction.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    const driverTransactions = await prisma.walletTransaction.findMany({
      where: { driverId: driver.driverProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    const restaurantTransactions = await prisma.walletTransaction.findMany({
      where: {
        OR: [
          { type: 'RESTAURANT_ORDER_EARNING' },
          { type: 'RESTAURANT_COMMISSION_DEDUCTION' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 2
    });
    
    console.log('Latest Customer Transaction:');
    console.log(customerTransactions[0] ? `  ${customerTransactions[0].type}: ₹${customerTransactions[0].amount} - ${customerTransactions[0].description}` : '  None found');
    
    console.log('Latest Driver Transaction:');
    console.log(driverTransactions[0] ? `  ${driverTransactions[0].type}: ₹${driverTransactions[0].amount} - ${driverTransactions[0].description}` : '  None found');
    
    console.log('Latest Restaurant Transactions:');
    restaurantTransactions.forEach(tx => {
      console.log(`  ${tx.type}: ₹${tx.amount} - ${tx.description}`);
    });
    
    console.log('\\n🎉 NEW PAYMENT FLOW TEST COMPLETED SUCCESSFULLY! 🎉');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testNewPaymentFlow();
