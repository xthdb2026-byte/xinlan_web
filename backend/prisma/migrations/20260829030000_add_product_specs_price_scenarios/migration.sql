-- 产品表扩展：技术参数表 / 价格信息 / 适用场景（JSON 字符串，SQLite 兼容）
ALTER TABLE `products` ADD COLUMN `specs` TEXT;
ALTER TABLE `products` ADD COLUMN `price_info` TEXT;
ALTER TABLE `products` ADD COLUMN `scenarios` TEXT;
