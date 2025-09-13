const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestOrders() {
  try {
    console.log('🚀 Creating test orders for driver assignment...');

    // Get a test customer and restaurant
    const testCustomer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER', status: 'ACTIVE' }
    });

    const testRestaurant = await prisma.restaurant.findFirst({
      where: { status: 'OPEN' },
      include: { menus: true }
    });

    if (!testCustomer) {
      console.log('❌ No test customer found. Creating one...');
      // Create a test customer if none exists
      const hashedPassword = await require('bcryptjs').hash('customer123', 10);
      
      const customerResult = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: 'Test Customer',
            phone: '9999999999',
            passwordHash: hashedPassword,
            role: 'CUSTOMER',
            status: 'ACTIVE'
          }
        });

        await tx.loyalty.create({
          data: {
            customerId: newUser.id,
            totalOrders: 0,
            loyaltyPoints: 0
          }
        });

        await tx.customerWallet.create({
          data: {
            customerId: newUser.id,
            balance: 500.00
          }
        });

        return newUser;
      });
      
      testCustomer = customerResult;
      console.log('✅ Test customer created');
    }

    if (!testRestaurant) {
      console.log('❌ No test restaurant found. Please create restaurants first.');
      return;
    }

    // Create test orders in different statuses
    const testOrders = [
      {
        customerId: testCustomer.id,
        restaurantId: testRestaurant.id,
        totalPrice: 450.00,
        deliveryFee: 40.00,
        commission: 67.50,
        status: 'PREPARING', // ✅ Early assignment available
        deliveryAddress: '123 Test Street, Sector 14, Gurugram',
        deliveryLat: 28.4595,
        deliveryLng: 77.0266,
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        preparingAt: new Date() // Food started cooking
      },
      {
        customerId: testCustomer.id,
        restaurantId: testRestaurant.id,
        totalPrice: 320.00,
        deliveryFee: 35.00,
        commission: 48.00,
        status: 'READY', // ✅ Ready for immediate pickup
        deliveryAddress: '456 Home Avenue, Sector 22, Gurugram',
        deliveryLat: 28.4525,
        deliveryLng: 77.0285,
        paymentMethod: 'CARD',
        paymentStatus: 'PAID'
      },
      {
        customerId: testCustomer.id,
        restaurantId: testRestaurant.id,
        totalPrice: 180.00,
        deliveryFee: 30.00,
        commission: 27.00,
        status: 'PREPARING', // ✅ Another early assignment
        deliveryAddress: '789 Park Road, Sector 18, Gurugram',
        deliveryLat: 28.4615,
        deliveryLng: 77.0245,
        paymentMethod: 'WALLET',
        paymentStatus: 'PAID',
        preparingAt: new Date(Date.now() - 5 * 60 * 1000) // Started 5 minutes ago
      }
    ];

    // Create orders with order items
    const createdOrders = [];
    
    for (const orderData of testOrders) {
      const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            ...orderData,
            // Add pickup location (restaurant location)
            pickupAddress: testRestaurant.address,
            pickupLat: testRestaurant.lat,
            pickupLng: testRestaurant.lng
          }
        });

        // Add some order items
        const menuItem = testRestaurant.menus[0]; // Use first menu item
        if (menuItem) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              menuId: menuItem.id,
              quantity: 2,
              price: menuItem.price
            }
          });
        }

        return newOrder;
      });

      createdOrders.push(order);
    }

    console.log(`✅ Created ${createdOrders.length} test orders!`);
    console.log(`
📦 TEST ORDERS CREATED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order #${createdOrders[0].id}:
🏪 ${testRestaurant.name}
💰 ₹${createdOrders[0].totalPrice} (${createdOrders[0].status})
📍 ${createdOrders[0].deliveryAddress}
🚚 Delivery fee: ₹${createdOrders[0].deliveryFee}

Order #${createdOrders[1].id}:
🏪 ${testRestaurant.name}
💰 ₹${createdOrders[1].totalPrice} (${createdOrders[1].status})
📍 ${createdOrders[1].deliveryAddress}
🚚 Delivery fee: ₹${createdOrders[1].deliveryFee}

Order #${createdOrders[2].id}:
🏪 ${testRestaurant.name}
💰 ₹${createdOrders[2].totalPrice} (${createdOrders[2].status})
📍 ${createdOrders[2].deliveryAddress}
🚚 Delivery fee: ₹${createdOrders[2].deliveryFee}

🎯 Driver can now see these orders in the app!
    `);

    // Also create some test earning history for the driver
    const driverUser = await prisma.user.findUnique({
      where: { phone: '9876543210' }
    });

    if (driverUser) {
      // Create some past earning transactions
      const earningTransactions = [
        { amount: 45.00, description: 'Delivery #001 - Pizza Palace' },
        { amount: 38.00, description: 'Delivery #002 - Burger King' },
        { amount: 52.00, description: 'Delivery #003 - Chinese Corner' },
      ];

      for (const transaction of earningTransactions) {
        await prisma.walletTransaction.create({
          data: {
            driverId: driverUser.id,
            amount: transaction.amount,
            type: 'DRIVER_EARNING',
            status: 'APPROVED',
            description: transaction.description,
            processedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24h
          }
        });
      }
      
      console.log('✅ Created earning history for driver');
    }

  } catch (error) {
    console.error('❌ Error creating test orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrders();
