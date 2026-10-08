// ============================================================================
// GOLD PLATFORM — PRISMA CLIENT SINGLETON
// ============================================================================
// ملاحظة أمنية: يتمتع العميل بمراقبة اتصال قاعدة البيانات
// وتطبيق مبدأ Zero-Trust على مستوى الاتصال

import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import { config } from '../config';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    // Explicit URL so bundled/severless environments don't need a runtime env var.
    // (Prisma's own runtime reads process.env.DATABASE_URL internally, which is
    // not set inside Netlify Functions — this bypasses that requirement.)
    datasources: { db: { url: config.database.url } },
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
    errorFormat: 'minimal',
  });

  // تسجيل الاستعلامات في بيئة التطوير فقط
  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      logger.debug('Prisma Query', {
        query: e.query,
        duration: `${e.duration}ms`,
      });
    });
  }

  // Prisma 5.x removed the 'error' event — log via middleware instead
  // client.$on('error', ...)

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// التحقق من اتصال قاعدة البيانات عند بدء التشغيل
export async function verifyDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connection verified successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    process.exit(1);
  }
}
