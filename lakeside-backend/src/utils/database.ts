import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Create global prisma instance to avoid multiple connections
declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern for Prisma client
const prisma = globalThis.__prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:@localhost:3306/lakeside_delivery"
    }
  },
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
