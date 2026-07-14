import { z } from 'zod';
import { ShipmentStatus } from '../../generated/prisma/enums';
import { paginationSchema } from '../../shared/pagination';

export const shipmentItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const createShipmentSchema = z.object({
  purchaseOrderId: z.string().min(1).optional(),
  containerNumber: z.string().optional(),
  originPort: z.string().min(1),
  destinationPort: z.string().min(1),
  estimatedArrival: z.coerce.date().optional(),
  freightCost: z.number().nonnegative().default(0),
  insuranceCost: z.number().nonnegative().default(0),
  dutyCost: z.number().nonnegative().default(0),
  customsCharges: z.number().nonnegative().default(0),
  currency: z.string().length(3),
  exchangeRateToBase: z.number().positive().default(1),
  items: z.array(shipmentItemSchema).min(1),
});

export const updateShipmentSchema = createShipmentSchema
  .omit({ items: true, purchaseOrderId: true })
  .partial();

export const updateShipmentStatusSchema = z.object({
  status: z.nativeEnum(ShipmentStatus),
  note: z.string().optional(),
  actualArrival: z.coerce.date().optional(),
});

export const listShipmentsQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(ShipmentStatus).optional(),
  purchaseOrderId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['estimatedArrival', 'createdAt', 'shipmentNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
export type ListShipmentsQuery = z.infer<typeof listShipmentsQuerySchema>;
