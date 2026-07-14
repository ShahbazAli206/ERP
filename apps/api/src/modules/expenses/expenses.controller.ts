import type { Request, Response } from 'express';
import { ApiError } from '../../shared/ApiError';
import { created, noContent, ok } from '../../shared/response';
import { storageService } from '../../shared/services/localStorage.service';
import { expensesService } from './expenses.service';
import {
  createExpenseSchema,
  expenseReportQuerySchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from './expenses.validation';

export const expensesController = {
  async list(req: Request, res: Response) {
    const query = listExpensesQuerySchema.parse(req.query);
    const { items, pagination } = await expensesService.list(query);
    ok(res, items, { pagination });
  },

  async getDetail(req: Request<{ id: string }>, res: Response) {
    const expense = await expensesService.getDetail(req.params.id);
    ok(res, expense);
  },

  async create(req: Request, res: Response) {
    const input = createExpenseSchema.parse(req.body);
    const expense = await expensesService.create(input, req.user!.sub);
    created(res, expense);
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateExpenseSchema.parse(req.body);
    const expense = await expensesService.update(req.params.id, input);
    ok(res, expense);
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    const attachments = await expensesService.delete(req.params.id);
    await Promise.all(attachments.map((a) => storageService.delete(a.fileUrl)));
    noContent(res);
  },

  async uploadAttachment(req: Request<{ id: string }>, res: Response) {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }
    const attachment = await expensesService.addAttachment(req.params.id, {
      fileName: req.file.originalname,
      fileUrl: `local:${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    created(res, attachment);
  },

  async downloadAttachment(req: Request<{ id: string; attachmentId: string }>, res: Response) {
    const attachment = await expensesService.getAttachmentForDownload(
      req.params.id,
      req.params.attachmentId,
    );
    res.download(storageService.resolvePath(attachment.fileUrl), attachment.fileName);
  },

  async removeAttachment(req: Request<{ id: string; attachmentId: string }>, res: Response) {
    const attachment = await expensesService.removeAttachment(
      req.params.id,
      req.params.attachmentId,
    );
    await storageService.delete(attachment.fileUrl);
    noContent(res);
  },

  async report(req: Request, res: Response) {
    const { from, to } = expenseReportQuerySchema.parse(req.query);
    const report = await expensesService.report(from, to);
    ok(res, report);
  },
};
