import { Router, Request } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { success, fail } from '../utils/response';
import { authMiddleware, adminOnly } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();
const adminRouter = Router();
adminRouter.use(authMiddleware);

// ==================== 配置 ====================
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const LOGO_DIR = path.join(UPLOAD_DIR, 'logos');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — 支持高分辨率 Logo（如 1920x1920 用于多场景适配）

if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

// ==================== 工具函数 ====================
function getOperator(req: Request): string {
  const u = req.user;
  if (!u) return 'anonymous';
  return `userId=${u.id}, username=${u.username}, role=${u.role}`;
}

async function writeAuditLog(
  action: string,
  targetType: string,
  targetId: number,
  detail: string | null,
  operator: string,
) {
  try {
    await prisma.auditLog.create({
      data: { action, targetType, targetId, detail, operator },
    });
  } catch (err) {
    logger.error(`[Audit] Failed to write log - ${err instanceof Error ? err.message : String(err)}`);
  }
}

function buildUrl(filepath: string): string {
  return `/uploads/logos/${filepath}`;
}

// ==================== 中间件：Logo 专用上传 ====================
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, LOGO_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    cb(null, `logo-${timestamp}-${random}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error('仅支持 png/jpg/jpeg/svg/webp/gif 格式'));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// ==================== 公开接口 ====================

// GET /api/logo/current - 获取当前启用的 logo（公开）
router.get('/current', async (_req, res, next) => {
  try {
    const logoConfig = await prisma.logoConfig.findFirst({
      where: { isDefault: true },
      include: { media: true },
    });

    if (!logoConfig || !logoConfig.mediaId) {
      return success(res, {
        url: null,
        isDefault: false,
        fallbackIcon: '/icon.svg',
      });
    }

    const media = await prisma.media.findUnique({ where: { id: logoConfig.mediaId } });
    if (!media) {
      return success(res, {
        url: null,
        isDefault: false,
        fallbackIcon: '/icon.svg',
      });
    }

    success(res, {
      id: media.id,
      url: media.url,
      filename: media.filename,
      mimeType: media.mimeType,
      isDefault: true,
    });
  } catch (err) {
    logger.error(`[Logo] Get current error - ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
});

// ==================== 管理接口 ====================

// GET /api/admin/logo/list - 获取所有 logo（管理端）
adminRouter.get('/list', adminOnly, async (req, res, next) => {
  try {
    const logos = await prisma.media.findMany({
      where: {
        filepath: {
          startsWith: 'logos/',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 查找当前默认 logo
    const defaultConfig = await prisma.logoConfig.findFirst({
      where: { isDefault: true },
    });
    const defaultMediaId = defaultConfig?.mediaId;

    const result = logos.map((logo) => ({
      ...logo,
      isDefault: logo.id === defaultMediaId,
    }));

    success(res, result);
  } catch (err) {
    logger.error(`[Logo] List error - ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
});

// POST /api/admin/logo/upload - 上传 logo
adminRouter.post('/upload', adminOnly, upload.single('file'), async (req, res, next) => {
  const operator = getOperator(req);
  try {
    if (!req.file) {
      logger.warn(`[Admin][Logo] Upload failed - no file, by ${operator}`);
      return fail(res, '请选择要上传的 logo 文件', 400);
    }

    const originalName = req.file.originalname;
    const size = req.file.size;
    const mimeType = req.file.mimetype;

    const relativePath = `logos/${path.basename(req.file.path)}`;
    const url = buildUrl(path.basename(req.file.path));

    let width: number | undefined;
    let height: number | undefined;
    try {
      if (mimeType !== 'image/svg+xml') {
        const metadata = await sharp(req.file.path).metadata();
        width = metadata.width;
        height = metadata.height;
      }
    } catch {
      logger.warn(`[Admin][Logo] Failed to read dimensions for ${originalName}`);
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

    // 写日志
    await writeAuditLog(
      'upload',
      'logo',
      media.id,
      JSON.stringify({ filename: originalName, size, mimeType }),
      operator,
    );

    logger.info(`[Admin][Logo] Upload success - id=${media.id}, by ${operator}`);
    success(res, media, 201);
  } catch (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        logger.warn(`[Admin][Logo] Upload failed - file too large, by ${operator}`);
        return fail(res, '文件大小不能超过 5MB', 400);
      }
      logger.warn(`[Admin][Logo] Upload multer error - ${err.message}, by ${operator}`);
      return fail(res, err.message, 400);
    }
    if (err instanceof Error && err.message.includes('仅支持')) {
      logger.warn(`[Admin][Logo] Upload failed - invalid type, by ${operator}`);
      return fail(res, err.message, 400);
    }
    logger.error(`[Admin][Logo] Upload error - ${err instanceof Error ? err.message : String(err)}, by ${operator}`);
    next(err);
  }
});

// POST /api/admin/logo/set-default - 设置默认 logo
adminRouter.post('/set-default', adminOnly, async (req, res, next) => {
  const operator = getOperator(req);
  try {
    const schema = z.object({
      mediaId: z.number().int().positive(),
    });
    const { mediaId } = schema.parse(req.body);

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      logger.warn(`[Admin][Logo] Set default failed - media not found, id=${mediaId}, by ${operator}`);
      return fail(res, '指定的 logo 文件不存在', 404);
    }

    // 先清除所有 isDefault
    await prisma.logoConfig.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // 使用固定 ID=1 作为 LogoConfig 记录
    const existingConfig = await prisma.logoConfig.findUnique({ where: { id: 1 } });
    let config;
    if (existingConfig) {
      config = await prisma.logoConfig.update({
        where: { id: 1 },
        data: { mediaId, isDefault: true },
      });
    } else {
      config = await prisma.logoConfig.create({
        data: { id: 1, mediaId, isDefault: true, name: 'default' },
      });
    }

    // 写日志
    await writeAuditLog(
      'set_default',
      'logo',
      mediaId,
      JSON.stringify({ filename: media.filename, url: media.url }),
      operator,
    );

    logger.info(`[Admin][Logo] Set default success - mediaId=${mediaId}, by ${operator}`);
    success(res, { ok: true, config });
  } catch (err) {
    logger.error(`[Admin][Logo] Set default error - ${err instanceof Error ? err.message : String(err)}, by ${operator}`);
    next(err);
  }
});

// DELETE /api/admin/logo/:id - 删除 logo
adminRouter.delete('/:id', adminOnly, async (req, res, next) => {
  const operator = getOperator(req);
  try {
    const id = Number(req.params.id);

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      logger.warn(`[Admin][Logo] Delete failed - not found, id=${id}, by ${operator}`);
      return fail(res, 'logo 不存在', 404);
    }

    // 检查是否是默认 logo
    const config = await prisma.logoConfig.findFirst({
      where: { mediaId: id },
    });

    if (config) {
      // 清除默认配置
      await prisma.logoConfig.delete({ where: { id: config.id } });
      logger.info(`[Admin][Logo] Removed from default - id=${id}, by ${operator}`);
    }

    // 删除媒体记录
    await prisma.media.delete({ where: { id } });

    // 删除文件
    const filePath = path.join(UPLOAD_DIR, media.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`[Admin][Logo] File deleted - ${media.filepath}, by ${operator}`);
    }

    // 写日志
    await writeAuditLog(
      'delete',
      'logo',
      id,
      JSON.stringify({ filename: media.filename, wasDefault: !!config }),
      operator,
    );

    logger.info(`[Admin][Logo] Delete success - id=${id}, by ${operator}`);
    success(res, { ok: true, wasDefault: !!config });
  } catch (err) {
    logger.error(`[Admin][Logo] Delete error - ${err instanceof Error ? err.message : String(err)}, by ${req.params.id}, by ${operator}`);
    next(err);
  }
});

// GET /api/admin/logo/audit-logs - 获取 logo 操作日志
adminRouter.get('/audit-logs', adminOnly, async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { targetType: 'logo' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    success(res, logs);
  } catch (err) {
    logger.error(`[Logo] Audit logs error - ${err instanceof Error ? err.message : String(err)}`);
    next(err);
  }
});

export { adminRouter as adminLogoRouter };
export default router;
