const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndUpdateRestaurantApproval() {
  try {
    console.log('Checking restaurant approval status...');
    
    // Get all restaurants
    const restaurants = await prisma.restaurant.findMany({
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

    console.log('Current restaurants:');
    restaurants.forEach(restaurant => {
      console.log(`- ID: ${restaurant.id}, Name: ${restaurant.name}, Phone: ${restaurant.user.phone}, Approved: ${restaurant.approved}`);
    });

    // Update existing restaurants to be approved (for testing)
    if (restaurants.length > 0) {
      console.log('\nUpdating existing restaurants to approved status...');
      const updateResult = await prisma.restaurant.updateMany({
        where: {
          approved: false,
        },
        data: {
          approved: true,
        }
      });
      console.log(`Updated ${updateResult.count} restaurants to approved status`);
    }

    // Check again
    const updatedRestaurants = await prisma.restaurant.findMany({
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

    console.log('\nUpdated restaurants:');
    updatedRestaurants.forEach(restaurant => {
      console.log(`- ID: ${restaurant.id}, Name: ${restaurant.name}, Phone: ${restaurant.user.phone}, Approved: ${restaurant.approved}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateRestaurantApproval();
