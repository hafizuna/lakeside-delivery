const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create restaurant owners (use upsert to avoid duplicates)
    const restaurantOwner1 = await prisma.user.upsert({
      where: { phone: '+251922772024' },
      update: {},
      create: {
        name: 'Mario Rossi',
        phone: '+251922772024',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'RESTAURANT',
        status: 'ACTIVE',
      },
    });

    const restaurantOwner2 = await prisma.user.upsert({
      where: { phone: '+251911234567' },
      update: {},
      create: {
        name: 'John Smith',
        phone: '+251911234567',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'RESTAURANT',
        status: 'ACTIVE',
      },
    });

    const restaurantOwner3 = await prisma.user.upsert({
      where: { phone: '+251912345678' },
      update: {},
      create: {
        name: 'Sarah Johnson',
        phone: '+251912345678',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'RESTAURANT',
        status: 'ACTIVE',
      },
    });

    // Create restaurants
    const restaurant1 = await prisma.restaurant.create({
      data: {
        id: restaurantOwner1.id,
        name: 'Burger Palace',
        address: '123 Main St, Downtown',
        lat: 34.0522,
        lng: -118.2437,
        commissionRate: 15.0,
        status: 'OPEN',
        logoUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop&crop=center',
        bannerUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=200&fit=crop',
        description: 'Premium burgers made with fresh, locally sourced ingredients',
        rating: 4.5,
        totalOrders: 127,
      },
    });

    const restaurant2 = await prisma.restaurant.create({
      data: {
        id: restaurantOwner2.id,
        name: 'Pizza Corner',
        address: '456 Oak Ave, Midtown',
        lat: 34.0622,
        lng: -118.2537,
        commissionRate: 12.0,
        status: 'OPEN',
        logoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop&crop=center',
        bannerUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=200&fit=crop',
        description: 'Authentic Italian pizza with traditional wood-fired oven',
        rating: 4.2,
        totalOrders: 89,
      },
    });

    const restaurant3 = await prisma.restaurant.create({
      data: {
        id: restaurantOwner3.id,
        name: 'Sweet Treats',
        address: '789 Pine St, Uptown',
        lat: 34.0722,
        lng: -118.2637,
        commissionRate: 18.0,
        status: 'OPEN',
        logoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop&crop=center',
        bannerUrl: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=200&fit=crop',
        description: 'Artisanal desserts and specialty coffee in a cozy atmosphere',
        rating: 4.8,
        totalOrders: 203,
      },
    });

    // Create menu items for Burger Palace
    await prisma.menu.createMany({
      data: [
        {
          restaurantId: restaurant1.id,
          itemName: 'Classic Burger',
          description: 'Juicy beef patty with lettuce, tomato, and our special sauce',
          price: 12.99,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant1.id,
          itemName: 'Chicken Burger',
          description: 'Grilled chicken breast with avocado and mayo',
          price: 11.99,
          imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e2dea5f0?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant1.id,
          itemName: 'Veggie Burger',
          description: 'Plant-based patty with fresh vegetables',
          price: 10.99,
          imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant1.id,
          itemName: 'French Fries',
          description: 'Crispy golden fries with sea salt',
          price: 4.99,
          imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=200&fit=crop',
          isAvailable: true,
        },
      ],
    });

    // Create menu items for Pizza Corner
    await prisma.menu.createMany({
      data: [
        {
          restaurantId: restaurant2.id,
          itemName: 'Margherita Pizza',
          description: 'Classic pizza with tomato sauce, mozzarella, and basil',
          price: 14.99,
          imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant2.id,
          itemName: 'Pepperoni Pizza',
          description: 'Traditional pizza with pepperoni and cheese',
          price: 16.99,
          imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant2.id,
          itemName: 'Veggie Supreme',
          description: 'Loaded with bell peppers, mushrooms, onions, and olives',
          price: 15.99,
          imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant2.id,
          itemName: 'Garlic Bread',
          description: 'Warm bread with garlic butter and herbs',
          price: 6.99,
          imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=300&h=200&fit=crop',
          isAvailable: true,
        },
      ],
    });

    // Create menu items for Sweet Treats
    await prisma.menu.createMany({
      data: [
        {
          restaurantId: restaurant3.id,
          itemName: 'Chocolate Chip Cookies',
          description: 'Freshly baked cookies with premium chocolate chips',
          price: 3.99,
          imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant3.id,
          itemName: 'Red Velvet Cake',
          description: 'Moist red velvet cake with cream cheese frosting',
          price: 8.99,
          imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant3.id,
          itemName: 'Cheesecake',
          description: 'Creamy New York style cheesecake',
          price: 7.99,
          imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300&h=200&fit=crop',
          isAvailable: true,
        },
        {
          restaurantId: restaurant3.id,
          itemName: 'Iced Coffee',
          description: 'Cold brew coffee with ice and your choice of milk',
          price: 4.99,
          imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop',
          isAvailable: true,
        },
      ],
    });

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - 3 restaurant owners`);
    console.log(`   - 3 restaurants`);
    console.log(`   - 12 menu items`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
