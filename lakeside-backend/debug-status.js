const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugStatusUpdate() {
  try {
    const orderId = 30;
    const driverId = 15;
    const newStatus = 'PICKED_UP';
    
    console.log('=== DEBUGGING STATUS UPDATE ===');
    console.log(`Order ID: ${orderId}`);
    console.log(`Driver ID: ${driverId}`);
    console.log(`New Status: ${newStatus}`);
    
    // Get current order
    const currentOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        driverId: driverId
      }
    });

    if (!currentOrder) {
      console.log('❌ Order not found or not assigned to driver');
      return;
    }

    console.log(`\n✅ Order found:`);
    console.log(`   Current Status: ${currentOrder.status}`);
    console.log(`   Driver ID: ${currentOrder.driverId}`);
    console.log(`   Order ID: ${currentOrder.id}`);

    // Check status transition validation
    const statusTransitions = {
      'PREPARING': ['READY', 'PICKED_UP'],
      'READY': ['PICKED_UP'],
      'PICKED_UP': ['DELIVERING'], 
      'DELIVERING': ['DELIVERED'],
      'DELIVERED': []
    };

    const allowedNextStatuses = statusTransitions[currentOrder.status] || [];
    console.log(`\n📋 Status Transition Check:`);
    console.log(`   From: ${currentOrder.status}`);
    console.log(`   To: ${newStatus}`);
    console.log(`   Allowed transitions: [${allowedNextStatuses.join(', ')}]`);
    console.log(`   Is valid: ${allowedNextStatuses.includes(newStatus) ? '✅ YES' : '❌ NO'}`);

    if (!allowedNextStatuses.includes(newStatus)) {
      console.log(`\n❌ VALIDATION ERROR: Cannot change from ${currentOrder.status} to ${newStatus}`);
      return;
    }

    // Try the update
    console.log(`\n🔄 Attempting status update...`);
    
    const updateData = { 
      status: newStatus,
      pickedUpAt: newStatus === 'PICKED_UP' ? new Date() : undefined
    };
    
    const result = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    console.log(`✅ Update successful!`);
    console.log(`   New Status: ${result.status}`);
    console.log(`   Updated At: ${new Date()}`);

  } catch (error) {
    console.error('❌ Update failed:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugStatusUpdate();
