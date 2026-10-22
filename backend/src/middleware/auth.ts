import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from '../utils/response';
import logger from '../utils/logger';

export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'xinlan-hengcheng-jwt-secret-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // 优先从 Authorization header 取 token，其次从 cookie 取
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    logger.warn(`[AuthMiddleware] No token provided - path=${req.path}, method=${req.method}, ip=${req.ip ?? '-'}`);
    return fail(res, '未登录，请先登录', 401, 'UNAUTHORIZED');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    logger.debug(`[AuthMiddleware] Token verified - userId=${decoded.id}, username=${decoded.username}, path=${req.path}`);
    next();
  } catch (err) {
    logger.warn(`[AuthMiddleware] Token invalid or expired - path=${req.path}, method=${req.method}, ip=${req.ip ?? '-'}, error=${err instanceof Error ? err.message : String(err)}`);
    return fail(res, '登录已过期，请重新登录', 401, 'TOKEN_EXPIRED');
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    logger.warn(`[AuthMiddleware] Admin access denied - userId=${req.user?.id ?? '-'}, username=${req.user?.username ?? '-'}, role=${req.user?.role ?? '-'}, path=${req.path}, method=${req.method}`);
    return fail(res, '无权限执行此操作', 403, 'FORBIDDEN');
  }
  next();
}
