import { Router, Request } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { success, fail, paginate } from '../utils/response';
import { authMiddleware, adminOnly } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// ==================== 配置 ====================
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 确保上传目录存在
function ensureUploadDir(year: string, month: string): string {
  const dir = path.join(UPLOAD_DIR, year, month);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// multer 存储配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dir = ensureUploadDir(year, month);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const filename = `${timestamp}-${random}${ext}`;
    cb(null, filename);
  },
});

// 文件过滤
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error('仅支持 jpg/jpeg/png/gif/webp 格式的图片'));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// 操作人信息提取
function getOperator(req: Request): string {
  const u = req.user;
  if (!u) return 'anonymous';
  return `userId=${u.id}, username=${u.username}, role=${u.role}`;
}

// 构建访问 URL
function buildUrl(filepath: string): string {
  return `/uploads/${filepath}`;
}

// ==================== 公开接口 ====================

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

// GET /api/media - 媒体列表（分页，按创建时间倒序）
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize } = listSchema.parse(req.query);

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.media.count(),
    ]);

    paginate(res, items, total, page, pageSize);
  } catch (err) {
    logger.error(`[Media] List error - ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
});

// ==================== 管理端接口 ====================

const adminRouter = Router();
adminRouter.use(authMiddleware);

// POST /api/admin/media/upload - 上传图片
adminRouter.post('/upload', adminOnly, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      logger.warn(`[Admin][Media] Upload failed - no file provided, by ${getOperator(req)}`);
      return fail(res, '请选择要上传的文件', 400);
    }

    const originalName = req.file.originalname;
    const size = req.file.size;
    const mimeType = req.file.mimetype;

    // 计算相对路径（相对 uploads 目录）
    const relativePath = path.relative(UPLOAD_DIR, req.file.path).split(path.sep).join('/');
    const url = buildUrl(relativePath);

    // 使用 sharp 获取图片宽高
    let width: number | undefined;
    let height: number | undefined;
    try {
      const metadata = await sharp(req.file.path).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (sharpErr) {
      logger.warn(`[Admin][Media] Failed to read image dimensions - ${sharpErr instanceof Error ? sharpErr.message : String(sharpErr)}, by ${getOperator(req)}`);
    }

    const media = await prisma.media.create({
      data: {
        filename: originalName,
        filepath: relativePath,
        url,
        mimeType,
        size,
        width,
        height,
      },
    });

    logger.info(`[Admin][Media] Upload success - id=${media.id}, filename="${originalName}", size=${size}, width=${width ?? '-'}, height=${height ?? '-'}, by ${getOperator(req)}`);
    success(res, media, 201);
  } catch (err) {
    // multer 错误处理
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        logger.warn(`[Admin][Media] Upload failed - file too large, by ${getOperator(req)}`);
        return fail(res, '文件大小不能超过 5MB', 400);
      }
      logger.warn(`[Admin][Media] Upload multer error - ${err.message}, by ${getOperator(req)}`);
      return fail(res, err.message, 400);
    }
    if (err instanceof Error && err.message.includes('仅支持')) {
      logger.warn(`[Admin][Media] Upload failed - invalid type, by ${getOperator(req)}`);
      return fail(res, err.message, 400);
    }
    logger.error(`[Admin][Media] Upload error - ${err instanceof Error ? err.message : String(err)}, by ${getOperator(req)}`);
    next(err);
  }
});

// DELETE /api/admin/media/:id - 删除媒体
adminRouter.delete('/:id', adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    logger.info(`[Admin][Media] Delete attempt - id=${id}, by ${getOperator(req)}`);

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      logger.warn(`[Admin][Media] Delete failed - not found, id=${id}, by ${getOperator(req)}`);
      return fail(res, '媒体不存在', 404);
    }

    // 删除数据库记录
    await prisma.media.delete({ where: { id } });

    // 删除本地文件
    const filePath = path.join(UPLOAD_DIR, media.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[Admin][Media] File deleted - ${media.filepath}, by ${getOperator(req)}`);
    } else {
      logger.warn(`[Admin][Media] File not found on disk - ${media.filepath}, by ${getOperator(req)}`);
    }

    logger.info(`[Admin][Media] Delete success - id=${id}, by ${getOperator(req)}`);
    success(res, { ok: true });
  } catch (err) {
    logger.error(`[Admin][Media] Delete error - ${err instanceof Error ? err.message : String(err)}, id=${req.params.id}, by ${getOperator(req)}`);
    next(err);
  }
});

export { adminRouter as adminMediaRouter };
export default router;
