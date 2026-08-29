import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
};

// Railway database එකට serverless වලදී connection drop වීම වැළැක්වීමට URL එකට parameters එකතු කිරීම
const databaseUrl = process.env.DATABASE_URL;
const connectionString = databaseUrl?.includes('?') 
  ? `${databaseUrl}&connection_limit=1&pool_timeout=30` 
  : `${databaseUrl}?connection_limit=1&pool_timeout=30`;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: connectionString,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}