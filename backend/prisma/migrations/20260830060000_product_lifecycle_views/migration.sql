-- 产品全生命周期 + 匿名浏览统计
-- 1) products 表新增 view_count / published_at
ALTER TABLE "products" ADD COLUMN "view_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "products" ADD COLUMN "published_at" DATETIME;

-- 存量已上架产品回填上架时间为创建时间
UPDATE "products" SET "published_at" = "created_at" WHERE "status" = 'active' AND "published_at" IS NULL;

-- 2) 产品浏览记录表（匿名：仅产品ID/来源路径/时间，不存 IP 与 UA）
CREATE TABLE "product_views" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER NOT NULL,
    "referrer" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_views_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "product_views_created_at_idx" ON "product_views"("created_at");
CREATE INDEX "product_views_product_id_created_at_idx" ON "product_views"("product_id", "created_at");
CREATE INDEX "products_view_count_idx" ON "products"("view_count");
