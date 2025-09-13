const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDriverAccount() {
  try {
    console.log('🚴‍♀️ Creating driver account...');

    // Hash the password
    const hashedPassword = await bcrypt.hash('driver123', 10);

    // Create driver user
    const driver = await prisma.user.upsert({
      where: { phone: '+251922772024' },
      update: {},
      create: {
        name: 'Test Driver',
        phone: '+251922772024',
        passwordHash: hashedPassword,
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Driver account created successfully!');
    console.log('📱 Phone: +251922772024 (or 0922772024)');
    console.log('🔑 Password: driver123');
    console.log('🆔 User ID:', driver.id);
    console.log('👤 Role:', driver.role);

    // Create second driver for testing
    const hashedPassword2 = await bcrypt.hash('driver456', 10);
    const driver2 = await prisma.user.upsert({
      where: { phone: '+251911223344' },
      update: {},
      create: {
        name: 'Ahmed Hassan',
        phone: '+251911223344',
        passwordHash: hashedPassword2,
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    });

    console.log('\n✅ Second driver account created!');
    console.log('📱 Phone: +251911223344 (or 0911223344)');
    console.log('🔑 Password: driver456');
    console.log('🆔 User ID:', driver2.id);

  } catch (error) {
    console.error('❌ Error creating driver account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDriverAccount()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
