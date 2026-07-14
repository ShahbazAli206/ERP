import type { Response } from 'express';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export function ok<T>(res: Response, data: T, meta?: { pagination?: Pagination }) {
  return res.status(200).json({ data, meta });
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ data });
}

export function noContent(res: Response) {
  return res.status(204).send();
}
