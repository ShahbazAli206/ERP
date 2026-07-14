import type { Request, Response } from 'express';
import { noContent, ok, created } from '../../shared/response';
import { shipmentsService } from './shipments.service';
import {
  createShipmentSchema,
  listShipmentsQuerySchema,
  updateShipmentSchema,
  updateShipmentStatusSchema,
} from './shipments.validation';

export const shipmentsController = {
  async list(req: Request, res: Response) {
    const query = listShipmentsQuerySchema.parse(req.query);
    const { items, pagination } = await shipmentsService.list(query);
    ok(res, items, { pagination });
  },

  async getDetail(req: Request<{ id: string }>, res: Response) {
    const detail = await shipmentsService.getDetail(req.params.id);
    ok(res, detail);
  },

  async create(req: Request, res: Response) {
    const input = createShipmentSchema.parse(req.body);
    const shipment = await shipmentsService.create(input);
    created(res, shipment);
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateShipmentSchema.parse(req.body);
    const shipment = await shipmentsService.update(req.params.id, input);
    ok(res, shipment);
  },

  async updateStatus(req: Request<{ id: string }>, res: Response) {
    const { status, note, actualArrival } = updateShipmentStatusSchema.parse(req.body);
    const shipment = await shipmentsService.updateStatus(
      req.params.id,
      req.user!.sub,
      status,
      note,
      actualArrival,
    );
    ok(res, shipment);
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await shipmentsService.delete(req.params.id);
    noContent(res);
  },
};
