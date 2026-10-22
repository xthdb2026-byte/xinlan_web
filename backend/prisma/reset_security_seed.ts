import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
(async () => {
  try {
    const adminHash = await bcrypt.hash('admin123', 12);
    const editorHash = await bcrypt.hash('editor123', 12);
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        password: adminHash,
        failedAttempts: 0,
        lockedUntil: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
      create: { username: 'admin', password: adminHash, role: 'admin' },
    });
    await prisma.user.upsert({
      where: { username: 'editor' },
      update: {
        password: editorHash,
        failedAttempts: 0,
        lockedUntil: null,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
      create: { username: 'editor', password: editorHash, role: 'editor' },
    });
    const cleaned = await prisma.user.updateMany({
      where: { lockedUntil: { not: null, lte: new Date() } },
      data: { lockedUntil: null, failedAttempts: 0 },
    });
    console.log('✅ seed完成: admin/editor 密码hash重写 + 2FA/锁定字段初始化');
    console.log('  过期锁定清理数:', cleaned.count);
  } catch (e) {
    console.error('seed 错误:', e instanceof Error ? e.message : String(e));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
