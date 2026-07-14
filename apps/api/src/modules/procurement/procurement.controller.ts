import type { Request, Response } from 'express';
import { ApiError } from '../../shared/ApiError';
import { created, noContent, ok } from '../../shared/response';
import { storageService } from '../../shared/services/localStorage.service';
import { procurementService } from './procurement.service';
import {
  createPurchaseOrderSchema,
  listPurchaseOrdersQuerySchema,
  rejectPurchaseOrderSchema,
  updatePurchaseOrderSchema,
} from './procurement.validation';

export const procurementController = {
  async list(req: Request, res: Response) {
    const query = listPurchaseOrdersQuerySchema.parse(req.query);
    const { items, pagination } = await procurementService.list(query);
    ok(res, items, { pagination });
  },

  async getDetail(req: Request<{ id: string }>, res: Response) {
    const detail = await procurementService.getDetail(req.params.id);
    ok(res, detail);
  },

  async create(req: Request, res: Response) {
    const input = createPurchaseOrderSchema.parse(req.body);
    const po = await procurementService.create(input, req.user!.sub);
    created(res, po);
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updatePurchaseOrderSchema.parse(req.body);
    const po = await procurementService.update(req.params.id, input);
    ok(res, po);
  },

  async submit(req: Request<{ id: string }>, res: Response) {
    const po = await procurementService.submit(req.params.id, req.user!.sub);
    ok(res, po);
  },

  async approve(req: Request<{ id: string }>, res: Response) {
    const po = await procurementService.approve(req.params.id, req.user!.sub);
    ok(res, po);
  },

  async reject(req: Request<{ id: string }>, res: Response) {
    const { reason } = rejectPurchaseOrderSchema.parse(req.body);
    const po = await procurementService.reject(req.params.id, req.user!.sub, reason);
    ok(res, po);
  },

  async markOrdered(req: Request<{ id: string }>, res: Response) {
    const po = await procurementService.markOrdered(req.params.id, req.user!.sub);
    ok(res, po);
  },

  async cancel(req: Request<{ id: string }>, res: Response) {
    const po = await procurementService.cancel(req.params.id, req.user!.sub);
    ok(res, po);
  },

  async deleteDraft(req: Request<{ id: string }>, res: Response) {
    await procurementService.deleteDraft(req.params.id);
    noContent(res);
  },

  async uploadAttachment(req: Request<{ id: string }>, res: Response) {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }
    const attachment = await procurementService.addAttachment(req.params.id, {
      fileName: req.file.originalname,
      fileUrl: `local:${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    created(res, attachment);
  },

  async downloadAttachment(req: Request<{ id: string; attachmentId: string }>, res: Response) {
    const attachment = await procurementService.getAttachmentForDownload(
      req.params.id,
      req.params.attachmentId,
    );
    res.download(storageService.resolvePath(attachment.fileUrl), attachment.fileName);
  },

  async removeAttachment(req: Request<{ id: string; attachmentId: string }>, res: Response) {
    const attachment = await procurementService.removeAttachment(
      req.params.id,
      req.params.attachmentId,
    );
    await storageService.delete(attachment.fileUrl);
    noContent(res);
  },
};
