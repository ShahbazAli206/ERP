import { ShipmentStatus } from '../../generated/prisma/enums';
import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { shipmentsRepository, type ShipmentDetail } from './shipments.repository';
import type {
  LandedCostSummaryDto,
  ShipmentDetailDto,
  ShipmentListItemDto,
} from './shipments.dto';
import type {
  CreateShipmentInput,
  ListShipmentsQuery,
  UpdateShipmentInput,
} from './shipments.validation';

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  [ShipmentStatus.BOOKED]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELAYED],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.ARRIVED_AT_PORT, ShipmentStatus.DELAYED],
  [ShipmentStatus.ARRIVED_AT_PORT]: [ShipmentStatus.CUSTOMS_CLEARANCE, ShipmentStatus.DELAYED],
  [ShipmentStatus.CUSTOMS_CLEARANCE]: [ShipmentStatus.DELIVERED, ShipmentStatus.DELAYED],
  // A delay is lateral, not a dead end — a delayed shipment can resume at any later stage.
  [ShipmentStatus.DELAYED]: [
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.ARRIVED_AT_PORT,
    ShipmentStatus.CUSTOMS_CLEARANCE,
    ShipmentStatus.DELIVERED,
  ],
  [ShipmentStatus.DELIVERED]: [],
};

function buildLandedCostSummary(shipment: ShipmentDetail): LandedCostSummaryDto {
  const totalAdditionalCostBase =
    (shipment.freightCost + shipment.insuranceCost + shipment.dutyCost + shipment.customsCharges) *
    shipment.exchangeRateToBase;

  const poItemsByProduct = new Map(
    shipment.purchaseOrder?.items.map((item) => [item.productId, item]) ?? [],
  );

  const weights = shipment.items.map((item) => {
    const poItem = poItemsByProduct.get(item.productId);
    return {
      item,
      poUnitCost: poItem?.unitPrice ?? null,
      weight: poItem ? item.quantity * poItem.unitPrice : item.quantity,
    };
  });
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0) || 1;

  return {
    freightCost: shipment.freightCost,
    insuranceCost: shipment.insuranceCost,
    dutyCost: shipment.dutyCost,
    customsCharges: shipment.customsCharges,
    currency: shipment.currency,
    exchangeRateToBase: shipment.exchangeRateToBase,
    totalAdditionalCostBase,
    items: weights.map(({ item, poUnitCost, weight }) => {
      const allocatedLandedCostBase = (weight / totalWeight) * totalAdditionalCostBase;
      return {
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        poUnitCost,
        allocatedLandedCostBase,
        landedUnitCostBase: allocatedLandedCostBase / item.quantity,
      };
    }),
  };
}

function toDetailDto(shipment: ShipmentDetail): ShipmentDetailDto {
  return {
    id: shipment.id,
    shipmentNumber: shipment.shipmentNumber,
    containerNumber: shipment.containerNumber,
    originPort: shipment.originPort,
    destinationPort: shipment.destinationPort,
    status: shipment.status,
    estimatedArrival: shipment.estimatedArrival,
    actualArrival: shipment.actualArrival,
    currency: shipment.currency,
    purchaseOrderId: shipment.purchaseOrderId,
    poNumber: shipment.purchaseOrder?.poNumber ?? null,
    items: shipment.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      quantity: item.quantity,
    })),
    statusHistory: shipment.statusHistory.map((h) => ({
      status: h.status,
      note: h.note,
      changedAt: h.changedAt,
      changedByName: h.changedBy?.name ?? null,
    })),
    landedCostSummary: buildLandedCostSummary(shipment),
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
  };
}

async function getOrThrow(id: string): Promise<ShipmentDetail> {
  const shipment = await shipmentsRepository.findById(id);
  if (!shipment) {
    throw ApiError.notFound('Shipment not found');
  }
  return shipment;
}

export const shipmentsService = {
  async list(
    query: ListShipmentsQuery,
  ): Promise<{ items: ShipmentListItemDto[]; pagination: Pagination }> {
    const { total, shipments } = await shipmentsRepository.list(query);
    return {
      items: shipments.map((s) => ({
        id: s.id,
        shipmentNumber: s.shipmentNumber,
        containerNumber: s.containerNumber,
        originPort: s.originPort,
        destinationPort: s.destinationPort,
        status: s.status,
        estimatedArrival: s.estimatedArrival,
        actualArrival: s.actualArrival,
        purchaseOrderId: s.purchaseOrderId,
        poNumber: s.purchaseOrder?.poNumber ?? null,
        createdAt: s.createdAt,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getDetail(id: string): Promise<ShipmentDetailDto> {
    return toDetailDto(await getOrThrow(id));
  },

  async create(input: CreateShipmentInput): Promise<ShipmentDetailDto> {
    const shipmentNumber = await shipmentsRepository.nextShipmentNumber();
    const { items, purchaseOrderId, ...rest } = input;
    const created = await shipmentsRepository.create({
      ...rest,
      shipmentNumber,
      purchaseOrder: purchaseOrderId ? { connect: { id: purchaseOrderId } } : undefined,
      items: { create: items },
    });
    return toDetailDto(created);
  },

  async update(id: string, input: UpdateShipmentInput): Promise<ShipmentDetailDto> {
    const shipment = await getOrThrow(id);
    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw ApiError.badRequest('Cannot edit a shipment that has already been delivered');
    }
    const updated = await shipmentsRepository.update(id, input);
    return toDetailDto(updated);
  },

  async updateStatus(
    id: string,
    userId: string,
    status: string,
    note?: string,
    actualArrival?: Date,
  ): Promise<ShipmentDetailDto> {
    const shipment = await getOrThrow(id);
    const allowed = ALLOWED_STATUS_TRANSITIONS[shipment.status] ?? [];
    if (!allowed.includes(status)) {
      throw ApiError.badRequest(
        `Cannot transition from ${shipment.status} to ${status}. Allowed: ${allowed.join(', ') || 'none (terminal status)'}`,
      );
    }
    const updated = await shipmentsRepository.updateStatus(id, status, userId, note, actualArrival);
    return toDetailDto(updated!);
  },

  async delete(id: string) {
    const shipment = await getOrThrow(id);
    if (shipment.status !== ShipmentStatus.BOOKED) {
      throw ApiError.badRequest('Can only delete a shipment while it is still BOOKED');
    }
    await shipmentsRepository.delete(id);
  },
};
