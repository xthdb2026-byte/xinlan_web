/**
 * 批量生成产品图片 CLI（本地 SVG 渲染）
 *
 * 用法：
 *   npx tsx scripts/generate_product_images.ts              # 处理所有缺图/外链图的在售产品
 *   npx tsx scripts/generate_product_images.ts --slug=xxx   # 仅处理指定产品
 *   npx tsx scripts/generate_product_images.ts --force      # 强制全部重新生成
 *
 * 行为：
 *  - 根据产品分类/名称自动选择设备形态模板（交换机/服务器/摄像机/平板/大屏…）
 *  - 生成正面/侧面/细节三视角 SVG，落盘至 uploads/products/
 *  - 数据库 coverImage/images 改存本地路径
 */
import { PrismaClient } from '@prisma/client';
import { generateImagesForProduct, needsGeneration } from '../src/lib/productImageGen';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const slugArg = args.find((a) => a.startsWith('--slug='))?.split('=')[1];

  const where = slugArg ? { slug: slugArg } : { status: 'active' };
  const products = await prisma.product.findMany({ where, orderBy: { sortOrder: 'asc' } });

  const targets = force ? products : products.filter((p) => needsGeneration(p));
  console.log(`📦 待处理产品: ${targets.length} / ${products.length}`);
  if (targets.length === 0) {
    console.log('✅ 无需处理');
    return;
  }

  let ok = 0;
  const failed: string[] = [];
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    console.log(`\n[${i + 1}/${targets.length}] ${p.name}`);
    try {
      const result = await generateImagesForProduct(
        {
          slug: p.slug,
          name: p.name,
          category: p.category,
        },
        (msg) => console.log(msg),
      );
      await prisma.product.update({
        where: { id: p.id },
        data: {
          coverImage: result.coverImage,
          images: JSON.stringify(result.images),
        },
      });
      ok += 1;
      console.log(`  ✅ 已更新数据库`);
    } catch (e) {
      failed.push(p.slug);
      console.error(`  ❌ 失败: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\n========== 汇总 ==========`);
  console.log(`成功: ${ok}，失败: ${failed.length}`);
  if (failed.length > 0) console.log(`失败列表: ${failed.join(', ')}`);
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main()
  .catch((e) => {
    console.error('❌ 脚本执行失败:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
