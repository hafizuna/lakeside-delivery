const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const prisma = new PrismaClient();

async function comprehensiveSeed() {
  try {
    console.log('🌱 Starting comprehensive database seeding...\n');

    // ==================== CUSTOMERS ====================
    console.log('👥 Creating customer accounts...');
    
    const customer1 = await prisma.user.upsert({
      where: { phone: '+251911111111' },
      update: {},
      create: {
        name: 'John Customer',
        phone: '+251911111111',
        passwordHash: await bcrypt.hash('customer123', 12),
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    const customer2 = await prisma.user.upsert({
      where: { phone: '+251922222222' },
      update: {},
      create: {
        name: 'Sarah Wilson',
        phone: '+251922222222',
        passwordHash: await bcrypt.hash('customer456', 12),
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });

    // Create customer wallets
    await prisma.customerWallet.upsert({
      where: { customerId: customer1.id },
      update: {},
      create: {
        customerId: customer1.id,
        balance: 50.00,
        totalTopUps: 100.00,
        totalSpent: 50.00,
      },
    });

    await prisma.customerWallet.upsert({
      where: { customerId: customer2.id },
      update: {},
      create: {
        customerId: customer2.id,
        balance: 75.00,
        totalTopUps: 150.00,
        totalSpent: 75.00,
      },
    });

    // Create loyalty records
    await prisma.loyalty.upsert({
      where: { customerId: customer1.id },
      update: {},
      create: {
        customerId: customer1.id,
        totalOrders: 5,
        loyaltyPoints: 250,
      },
    });

    await prisma.loyalty.upsert({
      where: { customerId: customer2.id },
      update: {},
      create: {
        customerId: customer2.id,
        totalOrders: 3,
        loyaltyPoints: 150,
      },
    });

    console.log('✅ Created 2 customers with wallets and loyalty records');

    // ==================== DRIVERS ====================
    console.log('\n🚗 Creating driver accounts...');

    const driver1 = await prisma.user.upsert({
      where: { phone: '+251933333333' },
      update: {},
      create: {
        name: 'Ahmed Driver',
        phone: '+251933333333',
        passwordHash: await bcrypt.hash('driver123', 12),
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    });

    const driver2 = await prisma.user.upsert({
      where: { phone: '+251944444444' },
      update: {},
      create: {
        name: 'Mohammed Hassan',
        phone: '+251944444444',
        passwordHash: await bcrypt.hash('driver456', 12),
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    });

    // Create driver profiles
    await prisma.driver.upsert({
      where: { id: driver1.id },
      update: {},
      create: {
        id: driver1.id,
        vehicleType: 'BIKE',
        licenseNumber: 'DL123456789',
        vehicleRegistration: 'AB-123-CD',
        approvalStatus: 'APPROVED',
        isAvailable: true,
        rating: 4.7,
        avgRating: 4.7,
        totalDeliveries: 45,
        completionRate: 98.5,
      },
    });

    await prisma.driver.upsert({
      where: { id: driver2.id },
      update: {},
      create: {
        id: driver2.id,
        vehicleType: 'BIKE',
        licenseNumber: 'DL987654321',
        vehicleRegistration: 'XY-789-ZW',
        approvalStatus: 'APPROVED',
        isAvailable: true,
        rating: 4.5,
        avgRating: 4.5,
        totalDeliveries: 32,
        completionRate: 96.2,
      },
    });

    // Create driver wallets
    await prisma.driverWallet.upsert({
      where: { driverId: driver1.id },
      update: {},
      create: {
        driverId: driver1.id,
        balance: 125.50,
        collateralAmount: 1000.00,
        totalEarnings: 850.75,
        totalWithdrawn: 725.25,
        canWithdraw: true,
      },
    });

    await prisma.driverWallet.upsert({
      where: { driverId: driver2.id },
      update: {},
      create: {
        driverId: driver2.id,
        balance: 89.25,
        collateralAmount: 1000.00,
        totalEarnings: 640.80,
        totalWithdrawn: 551.55,
        canWithdraw: true,
      },
    });

    console.log('✅ Created 2 drivers with profiles and wallets');

    // ==================== RESTAURANTS ====================
    console.log('\n🍽️ Creating restaurant accounts...');

    const restaurantOwner1 = await prisma.user.upsert({
      where: { phone: '+251955555555' },
      update: {},
      create: {
        name: 'Mario Rossi',
        phone: '+251955555555',
        passwordHash: await bcrypt.hash('restaurant123', 12),
        role: 'RESTAURANT',
        status: 'ACTIVE',
      },
    });

    const restaurantOwner2 = await prisma.user.upsert({
      where: { phone: '+251966666666' },
      update: {},
      create: {
        name: 'Sofia Italian',
        phone: '+251966666666',
        passwordHash: await bcrypt.hash('restaurant456', 12),
        role: 'RESTAURANT',
        status: 'ACTIVE',
      },
    });

    const restaurantOwner3 = await prisma.user.upsert({
      where: { phone: '+251977777777' },
      update: {},
      create: {
        name: 'Chen Wei',
        phone: '+251977777777',
        passwordHash: await bcrypt.hash('restaurant789', 12),
        role: 'RESTAURANT',
        status: 'ACTIVE',
      },
    });

    // Create restaurants
    const restaurant1 = await prisma.restaurant.upsert({
      where: { id: restaurantOwner1.id },
      update: {},
      create: {
        id: restaurantOwner1.id,
        name: 'Burger Palace',
        address: '123 Main St, Downtown Addis Ababa',
        lat: 9.0192,
        lng: 38.7525,
        commissionRate: 15.0,
        status: 'OPEN',
        logoUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop&crop=center',
        bannerUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=200&fit=crop',
        description: 'Premium burgers made with fresh, locally sourced ingredients',
        rating: 4.5,
        totalOrders: 127,
      },
    });

    const restaurant2 = await prisma.restaurant.upsert({
      where: { id: restaurantOwner2.id },
      update: {},
      create: {
        id: restaurantOwner2.id,
        name: 'Pizza Corner',
        address: '456 Bole Road, Bole District',
        lat: 9.0084,
        lng: 38.7975,
        commissionRate: 12.0,
        status: 'OPEN',
        logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop&crop=center',
        bannerUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=200&fit=crop',
        description: 'Authentic Italian pizza with traditional wood-fired oven',
        rating: 4.2,
        totalOrders: 89,
      },
    });

    const restaurant3 = await prisma.restaurant.upsert({
      where: { id: restaurantOwner3.id },
      update: {},
      create: {
        id: restaurantOwner3.id,
        name: 'Dragon Kitchen',
        address: '789 Piazza Area, Central District',
        lat: 9.0300,
        lng: 38.7400,
        commissionRate: 18.0,
        status: 'OPEN',
        logoUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=100&h=100&fit=crop&crop=center',
        bannerUrl: 'https://images.unsplash.com/photo-1559847844-d464622bb99d?w=400&h=200&fit=crop',
        description: 'Authentic Chinese cuisine with modern presentation',
        rating: 4.6,
        totalOrders: 156,
      },
    });

    console.log('✅ Created 3 restaurants');

    // ==================== MENU ITEMS ====================
    console.log('\n🍔 Adding menu items...');

    // Burger Palace Menu
    await prisma.menu.createMany({
      data: [
        {
          restaurantId: restaurant1.id,
          itemName: 'Classic Burger',
          description: 'Juicy beef patty with lettuce, tomato, and our special sauce',
          price: 12.99,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Burgers',
        },
        {
          restaurantId: restaurant1.id,
          itemName: 'Chicken Burger',
          description: 'Grilled chicken breast with avocado and mayo',
          price: 11.99,
          imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e2dea5f0?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Burgers',
        },
        {
          restaurantId: restaurant1.id,
          itemName: 'Veggie Burger',
          description: 'Plant-based patty with fresh vegetables',
          price: 10.99,
          imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Burgers',
        },
        {
          restaurantId: restaurant1.id,
          itemName: 'French Fries',
          description: 'Crispy golden fries with sea salt',
          price: 4.99,
          imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Sides',
        },
        {
          restaurantId: restaurant1.id,
          itemName: 'Chicken Wings',
          description: 'Spicy buffalo wings with ranch dip',
          price: 8.99,
          imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Sides',
        },
      ],
      skipDuplicates: true,
    });

    // Pizza Corner Menu
    await prisma.menu.createMany({
      data: [
        {
          restaurantId: restaurant2.id,
          itemName: 'Margherita Pizza',
          description: 'Classic pizza with tomato sauce, mozzarella, and basil',
          price: 14.99,
          imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Pizza',
        },
        {
          restaurantId: restaurant2.id,
          itemName: 'Pepperoni Pizza',
          description: 'Traditional pizza with pepperoni and cheese',
          price: 16.99,
          imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Pizza',
        },
        {
          restaurantId: restaurant2.id,
          itemName: 'Veggie Supreme',
          description: 'Loaded with bell peppers, mushrooms, onions, and olives',
          price: 15.99,
          imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Pizza',
        },
        {
          restaurantId: restaurant2.id,
          itemName: 'Garlic Bread',
          description: 'Warm bread with garlic butter and herbs',
          price: 6.99,
          imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Sides',
        },
        {
          restaurantId: restaurant2.id,
          itemName: 'Caesar Salad',
          description: 'Fresh romaine lettuce with parmesan and croutons',
          price: 9.99,
          imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Salads',
        },
      ],
      skipDuplicates: true,
    });

    // Dragon Kitchen Menu
    await prisma.menu.createMany({
      data: [
        {
          restaurantId: restaurant3.id,
          itemName: 'Sweet & Sour Chicken',
          description: 'Crispy chicken with pineapple in sweet and sour sauce',
          price: 13.99,
          imageUrl: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Main Dishes',
        },
        {
          restaurantId: restaurant3.id,
          itemName: 'Kung Pao Chicken',
          description: 'Spicy stir-fried chicken with peanuts and vegetables',
          price: 12.99,
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d30a?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Main Dishes',
        },
        {
          restaurantId: restaurant3.id,
          itemName: 'Beef Lo Mein',
          description: 'Stir-fried noodles with tender beef and vegetables',
          price: 14.99,
          imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Noodles',
        },
        {
          restaurantId: restaurant3.id,
          itemName: 'Fried Rice',
          description: 'Wok-fried rice with egg and mixed vegetables',
          price: 8.99,
          imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Rice',
        },
        {
          restaurantId: restaurant3.id,
          itemName: 'Spring Rolls',
          description: 'Crispy vegetable spring rolls with dipping sauce',
          price: 6.99,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&h=200&fit=crop',
          isAvailable: true,
          category: 'Appetizers',
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Added menu items to all restaurants');

    // ==================== SAMPLE ORDERS ====================
    console.log('\n📦 Creating sample orders...');

    // Create some sample orders
    const order1 = await prisma.order.create({
      data: {
        customerId: customer1.id,
        restaurantId: restaurant1.id,
        totalPrice: 18.98,
        deliveryFee: 2.50,
        commission: 2.85,
        status: 'DELIVERED',
        deliveryAddress: '456 Customer Street, Addis Ababa',
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });

    const order2 = await prisma.order.create({
      data: {
        customerId: customer2.id,
        restaurantId: restaurant2.id,
        totalPrice: 22.98,
        deliveryFee: 3.00,
        commission: 3.45,
        status: 'DELIVERED',
        deliveryAddress: '789 Another Street, Addis Ababa',
        paymentMethod: 'WALLET',
        paymentStatus: 'PAID',
        deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });

    const order3 = await prisma.order.create({
      data: {
        customerId: customer1.id,
        restaurantId: restaurant3.id,
        totalPrice: 27.97,
        deliveryFee: 2.50,
        commission: 4.20,
        status: 'PREPARING',
        deliveryAddress: '456 Customer Street, Addis Ababa',
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING',
        createdAt: new Date(),
      },
    });

    console.log('✅ Created sample orders (including delivered ones for rating testing)');

    // ==================== SUMMARY ====================
    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('='.repeat(60));
    console.log('📱 LOGIN CREDENTIALS:');
    console.log('='.repeat(60));
    
    console.log('\n👥 CUSTOMERS:');
    console.log('   Customer 1:');
    console.log('     Phone: +251911111111 (or 0911111111)');
    console.log('     Password: customer123');
    console.log('     Name: John Customer');
    console.log('     Wallet Balance: $50.00');
    console.log('');
    console.log('   Customer 2:');
    console.log('     Phone: +251922222222 (or 0922222222)');
    console.log('     Password: customer456');
    console.log('     Name: Sarah Wilson');
    console.log('     Wallet Balance: $75.00');

    console.log('\n🚗 DRIVERS:');
    console.log('   Driver 1:');
    console.log('     Phone: +251933333333 (or 0933333333)');
    console.log('     Password: driver123');
    console.log('     Name: Ahmed Driver');
    console.log('     Status: APPROVED & AVAILABLE');
    console.log('     Rating: 4.7/5.0');
    console.log('');
    console.log('   Driver 2:');
    console.log('     Phone: +251944444444 (or 0944444444)');
    console.log('     Password: driver456');
    console.log('     Name: Mohammed Hassan');
    console.log('     Status: APPROVED & AVAILABLE');
    console.log('     Rating: 4.5/5.0');

    console.log('\n🍽️ RESTAURANTS:');
    console.log('   Restaurant 1:');
    console.log('     Phone: +251955555555 (or 0955555555)');
    console.log('     Password: restaurant123');
    console.log('     Name: Mario Rossi');
    console.log('     Restaurant: Burger Palace');
    console.log('     Menu Items: 5 items');
    console.log('');
    console.log('   Restaurant 2:');
    console.log('     Phone: +251966666666 (or 0966666666)');
    console.log('     Password: restaurant456');
    console.log('     Name: Sofia Italian');
    console.log('     Restaurant: Pizza Corner');
    console.log('     Menu Items: 5 items');
    console.log('');
    console.log('   Restaurant 3:');
    console.log('     Phone: +251977777777 (or 0977777777)');
    console.log('     Password: restaurant789');
    console.log('     Name: Chen Wei');
    console.log('     Restaurant: Dragon Kitchen');
    console.log('     Menu Items: 5 items');

    console.log('\n📊 DATABASE SUMMARY:');
    console.log('   ✅ 2 Customers with wallets & loyalty');
    console.log('   ✅ 2 Drivers with profiles & wallets');
    console.log('   ✅ 3 Restaurants with full menus');
    console.log('   ✅ 15 Menu items with images');
    console.log('   ✅ 3 Sample orders (2 delivered for rating tests)');

    console.log('\n🎯 RATING TEST INSTRUCTIONS:');
    console.log('   1. Login as a customer (phone: 0911111111 or 0922222222)');
    console.log('   2. Go to Order History tab');
    console.log('   3. Look for delivered orders with rating buttons');
    console.log('   4. Test "Rate Order" and "Rate Restaurant" functionality');

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveSeed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
