const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderPaymentFlow() {
  try {
    console.log('=== TESTING COMPLETE ORDER PAYMENT FLOW ===\n');

    // 1. Check initial customer wallet balance
    console.log('1. INITIAL CUSTOMER WALLET STATE:');
    const customerWallet = await prisma.customerWallet.findFirst({
      include: {
        customer: { select: { name: true, phone: true } }
      }
    });
    
    if (customerWallet) {
      console.log(`Customer: ${customerWallet.customer.name} (${customerWallet.customer.phone})`);
      console.log(`Balance: ₹${customerWallet.balance}`);
      console.log(`Total Spent: ₹${customerWallet.totalSpent}\n`);
    } else {
      console.log('No customer wallet found\n');
    }

    // 2. Check initial driver wallet balance
    console.log('2. INITIAL DRIVER WALLET STATE:');
    const driverWallet = await prisma.driverWallet.findFirst({
      include: {
        driver: {
          include: {
            user: { select: { name: true, phone: true } }
          }
        }
      }
    });
    
    if (driverWallet) {
      console.log(`Driver: ${driverWallet.driver.user.name} (${driverWallet.driver.user.phone})`);
      console.log(`Balance: ₹${driverWallet.balance}`);
      console.log(`Total Earnings: ₹${driverWallet.totalEarnings}\n`);
    } else {
      console.log('No driver wallet found\n');
    }

    // 3. Check recent orders with wallet payment
    console.log('3. RECENT WALLET ORDERS:');
    const walletOrders = await prisma.order.findMany({
      where: {
        paymentMethod: 'WALLET'
      },
      include: {
        customer: { select: { name: true } },
        restaurant: { select: { name: true } },
        driver: { select: { name: true } },
        orderItems: {
          include: {
            menu: { select: { itemName: true, price: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    walletOrders.forEach(order => {
      console.log(`\nOrder #${order.id}:`);
      console.log(`  Customer: ${order.customer.name}`);
      console.log(`  Restaurant: ${order.restaurant.name}`);
      console.log(`  Driver: ${order.driver?.name || 'Not assigned'}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Payment: ${order.paymentMethod} (${order.paymentStatus})`);
      console.log(`  Subtotal: ₹${order.totalPrice}`);
      console.log(`  Delivery Fee: ₹${order.deliveryFee}`);
      console.log(`  Commission (15%): ₹${order.commission}`);
      console.log(`  Driver Earning: ₹${order.driverEarning}`);
      console.log(`  Platform Commission: ₹${order.platformCommission}`);
      console.log(`  Total Paid: ₹${parseFloat(order.totalPrice) + parseFloat(order.deliveryFee)}`);
      console.log(`  Items:`);
      order.orderItems.forEach(item => {
        console.log(`    - ${item.menu.itemName} x${item.quantity} @ ₹${item.price} each`);
      });
    });

    // 4. Check wallet transactions for customer payments
    console.log('\n\n4. CUSTOMER WALLET TRANSACTIONS:');
    const customerTransactions = await prisma.walletTransaction.findMany({
      where: {
        customerId: { not: null },
        type: 'CUSTOMER_ORDER_PAYMENT'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    customerTransactions.forEach(txn => {
      console.log(`  Transaction #${txn.id}:`);
      console.log(`    Amount: ₹${Math.abs(txn.amount)} (deducted)`);
      console.log(`    Type: ${txn.type}`);
      console.log(`    Status: ${txn.status}`);
      console.log(`    Description: ${txn.description}`);
      console.log(`    Date: ${txn.createdAt}`);
    });

    // 5. Check wallet transactions for driver earnings
    console.log('\n\n5. DRIVER WALLET TRANSACTIONS:');
    const driverTransactions = await prisma.walletTransaction.findMany({
      where: {
        driverId: { not: null },
        type: 'DRIVER_EARNING'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    driverTransactions.forEach(txn => {
      console.log(`  Transaction #${txn.id}:`);
      console.log(`    Amount: ₹${txn.amount} (credited)`);
      console.log(`    Type: ${txn.type}`);
      console.log(`    Status: ${txn.status}`);
      console.log(`    Description: ${txn.description}`);
      console.log(`    Date: ${txn.createdAt}`);
    });

    // 6. Calculate and verify commission accuracy
    console.log('\n\n6. COMMISSION VERIFICATION:');
    const ordersWithCommission = await prisma.order.findMany({
      where: {
        paymentMethod: 'WALLET',
        paymentStatus: 'PAID',
        commission: { gt: 0 }
      },
      select: {
        id: true,
        totalPrice: true,
        deliveryFee: true,
        commission: true,
        driverEarning: true,
        platformCommission: true
      },
      take: 3
    });

    ordersWithCommission.forEach(order => {
      const expectedCommission = parseFloat(order.totalPrice) * 0.15;
      const expectedDriverEarning = parseFloat(order.deliveryFee) * 0.8;
      const expectedPlatformCommission = parseFloat(order.deliveryFee) * 0.2;
      
      console.log(`\nOrder #${order.id} Commission Analysis:`);
      console.log(`  Subtotal: ₹${order.totalPrice}`);
      console.log(`  Expected Commission (15%): ₹${expectedCommission.toFixed(2)}`);
      console.log(`  Actual Commission: ₹${order.commission}`);
      console.log(`  Commission Correct: ${Math.abs(parseFloat(order.commission) - expectedCommission) < 0.01 ? '✅' : '❌'}`);
      
      console.log(`  Delivery Fee: ₹${order.deliveryFee}`);
      console.log(`  Expected Driver Earning (80%): ₹${expectedDriverEarning.toFixed(2)}`);
      console.log(`  Actual Driver Earning: ₹${order.driverEarning}`);
      console.log(`  Driver Earning Correct: ${Math.abs(parseFloat(order.driverEarning) - expectedDriverEarning) < 0.01 ? '✅' : '❌'}`);
      
      console.log(`  Expected Platform Commission (20%): ₹${expectedPlatformCommission.toFixed(2)}`);
      console.log(`  Actual Platform Commission: ₹${order.platformCommission}`);
      console.log(`  Platform Commission Correct: ${Math.abs(parseFloat(order.platformCommission) - expectedPlatformCommission) < 0.01 ? '✅' : '❌'}`);
    });

    // 7. Summary statistics
    console.log('\n\n7. PAYMENT FLOW SUMMARY:');
    
    const totalCustomerPayments = await prisma.walletTransaction.aggregate({
      where: {
        type: 'CUSTOMER_ORDER_PAYMENT',
        status: 'APPROVED'
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const totalDriverEarnings = await prisma.walletTransaction.aggregate({
      where: {
        type: 'DRIVER_EARNING',
        status: 'APPROVED'
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const totalCommissions = await prisma.order.aggregate({
      where: {
        paymentMethod: 'WALLET',
        paymentStatus: 'PAID'
      },
      _sum: { commission: true, platformCommission: true }
    });

    console.log(`Total Customer Payments: ₹${Math.abs(totalCustomerPayments._sum.amount || 0)} (${totalCustomerPayments._count} transactions)`);
    console.log(`Total Driver Earnings: ₹${totalDriverEarnings._sum.amount || 0} (${totalDriverEarnings._count} transactions)`);
    console.log(`Total Restaurant Commission: ₹${totalCommissions._sum.commission || 0}`);
    console.log(`Total Platform Commission: ₹${totalCommissions._sum.platformCommission || 0}`);

    // 8. Check for any inconsistencies
    console.log('\n\n8. SYSTEM INTEGRITY CHECK:');
    
    // Check for orders with wallet payment but no corresponding wallet transaction
    const walletOrdersWithoutTransaction = await prisma.order.findMany({
      where: {
        paymentMethod: 'WALLET',
        paymentStatus: 'PAID',
        customerId: {
          notIn: await prisma.walletTransaction.findMany({
            where: { type: 'CUSTOMER_ORDER_PAYMENT' },
            select: { customerId: true }
          }).then(txns => txns.map(t => t.customerId).filter(Boolean))
        }
      }
    });

    if (walletOrdersWithoutTransaction.length > 0) {
      console.log(`❌ Found ${walletOrdersWithoutTransaction.length} paid wallet orders without corresponding wallet transactions`);
      walletOrdersWithoutTransaction.forEach(order => {
        console.log(`  - Order #${order.id}: ₹${parseFloat(order.totalPrice) + parseFloat(order.deliveryFee)} not deducted`);
      });
    } else {
      console.log('✅ All paid wallet orders have corresponding wallet transactions');
    }

    // Check for delivered orders without driver earnings
    const deliveredOrdersWithoutEarnings = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        driverId: { not: null },
        driverId: {
          notIn: await prisma.walletTransaction.findMany({
            where: { type: 'DRIVER_EARNING' },
            select: { driverId: true }
          }).then(txns => txns.map(t => t.driverId).filter(Boolean))
        }
      }
    });

    if (deliveredOrdersWithoutEarnings.length > 0) {
      console.log(`❌ Found ${deliveredOrdersWithoutEarnings.length} delivered orders without driver earnings`);
      deliveredOrdersWithoutEarnings.forEach(order => {
        console.log(`  - Order #${order.id}: Driver #${order.driverId} not credited ₹${order.driverEarning}`);
      });
    } else {
      console.log('✅ All delivered orders have corresponding driver earnings');
    }

  } catch (error) {
    console.error('Error testing order payment flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderPaymentFlow();
