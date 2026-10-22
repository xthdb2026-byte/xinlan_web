import { Response } from 'express';

export function success<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ code: 'OK', data });
}

export function paginate<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return res.status(200).json({
    code: 'OK',
    data: {
      items,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  });
}

export function fail(res: Response, message: string, status = 400, code = 'ERROR', extra?: Record<string, unknown>) {
  return res.status(status).json({ code, message, ...extra });
}
