import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../shared/response';
import { suppliersService } from './suppliers.service';
import {
  createSupplierSchema,
  listSuppliersQuerySchema,
  supplierContactSchema,
  updateSupplierSchema,
} from './suppliers.validation';

export const suppliersController = {
  async list(req: Request, res: Response) {
    const query = listSuppliersQuerySchema.parse(req.query);
    const { items, pagination } = await suppliersService.list(query);
    ok(res, items, { pagination });
  },

  async getProfile(req: Request<{ id: string }>, res: Response) {
    const profile = await suppliersService.getProfile(req.params.id);
    ok(res, profile);
  },

  async create(req: Request, res: Response) {
    const input = createSupplierSchema.parse(req.body);
    const supplier = await suppliersService.create(input);
    created(res, supplier);
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const input = updateSupplierSchema.parse(req.body);
    const supplier = await suppliersService.update(req.params.id, input);
    ok(res, supplier);
  },

  async deactivate(req: Request<{ id: string }>, res: Response) {
    await suppliersService.deactivate(req.params.id);
    noContent(res);
  },

  async addContact(req: Request<{ id: string }>, res: Response) {
    const input = supplierContactSchema.parse(req.body);
    const contact = await suppliersService.addContact(req.params.id, input);
    created(res, contact);
  },

  async removeContact(req: Request<{ id: string; contactId: string }>, res: Response) {
    await suppliersService.removeContact(req.params.id, req.params.contactId);
    noContent(res);
  },
};
