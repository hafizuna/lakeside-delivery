const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('=== ALL ORDERS ===');
    const orders = await prisma.order.findMany({
      include: {
        restaurant: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    
    orders.forEach(order => {
      console.log(`Order #${order.id}: ${order.status} | Driver: ${order.driverId || 'None'} | Restaurant: ${order.restaurant.name} | Customer: ${order.customer.name}`);
    });

    console.log('\n=== ACTIVE ORDERS (PREPARING/READY) ===');
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PREPARING', 'READY'] }
      },
      include: {
        restaurant: { select: { name: true } },
        customer: { select: { name: true } },
      }
    });
    
    activeOrders.forEach(order => {
      console.log(`Order #${order.id}: ${order.status} | Driver: ${order.driverId || 'None'} | Restaurant: ${order.restaurant.name}`);
    });

    console.log('\n=== ASSIGNED ORDERS (WITH DRIVER) ===');
    const assignedOrders = await prisma.order.findMany({
      where: {
        driverId: { not: null }
      },
      include: {
        restaurant: { select: { name: true } },
        customer: { select: { name: true } },
      }
    });
    
    assignedOrders.forEach(order => {
      console.log(`Order #${order.id}: ${order.status} | Driver: ${order.driverId} | Restaurant: ${order.restaurant.name}`);
    });

  } catch (error) {
    console.error('Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();
