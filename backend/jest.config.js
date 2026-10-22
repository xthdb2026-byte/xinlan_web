/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  // 每个测试文件加载前先注入测试环境变量（测试库、放宽限流等）
  setupFiles: ['<rootDir>/tests/setup.ts'],
  // 全部测试开始前将 schema 推送到独立测试库
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  transform: {
    // isolatedModules：仅转译不做全量类型检查，速度更快
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  testTimeout: 30000,
  // 串行执行：所有用例共享同一个 SQLite 测试库，避免并发写冲突
  maxWorkers: 1,
};
