import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

/**
 * Jest globalSetup：全部测试开始前执行一次。
 * 将 Prisma schema 推送到独立测试库（prisma/test.db），与开发库 dev.db 完全隔离。
 */
export default async function globalSetup() {
  const backendRoot = path.resolve(__dirname, '..');
  const testDbPath = path.join(backendRoot, 'prisma', 'test.db');

  // 清理上一次运行的残留，保证结构最新
  if (fs.existsSync(testDbPath)) {
    fs.rmSync(testDbPath);
  }

  execSync('npx prisma db push --force-reset --skip-generate', {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
  });
}
