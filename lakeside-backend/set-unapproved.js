const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setRestaurantUnapproved() {
  try {
    console.log('Setting first restaurant to unapproved for testing...');
    
    const result = await prisma.restaurant.updateMany({
      where: {
        id: 5, // First restaurant
      },
      data: {
        approved: false,
      }
    });
    
    console.log(`Updated ${result.count} restaurant to unapproved status`);
    
    // Verify
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: 5 },
      select: {
        id: true,
        name: true,
        approved: true,
        user: {
          select: {
            phone: true,
          }
        }
      }
    });
    
    console.log('Restaurant status:', restaurant);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setRestaurantUnapproved();
