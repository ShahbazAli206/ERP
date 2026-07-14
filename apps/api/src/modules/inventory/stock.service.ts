import { stockRepository } from './stock.repository';
import type { ExpiryAlertDto, LowStockAlertDto, ValuationSummaryDto } from './stock.dto';
import type { CreateGoodsReceiptInput, StockAdjustmentInput } from './stock.validation';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const stockService = {
  goodsReceipt(input: CreateGoodsReceiptInput) {
    return stockRepository.goodsReceipt(input);
  },

  adjust(input: StockAdjustmentInput) {
    return stockRepository.adjust(input);
  },

  async lowStockAlerts(): Promise<LowStockAlertDto[]> {
    return stockRepository.lowStockProducts();
  },

  async expiryAlerts(withinDays: number): Promise<ExpiryAlertDto[]> {
    const lots = await stockRepository.expiringLots(withinDays);
    const now = Date.now();
    return lots.map((lot) => ({
      lotId: lot.id,
      productId: lot.productId,
      productName: lot.product.name,
      sku: lot.product.sku,
      warehouseName: lot.warehouse.name,
      lotNumber: lot.lotNumber,
      quantity: lot.quantity,
      expiryDate: lot.expiryDate!,
      isExpired: lot.expiryDate!.getTime() < now,
      daysUntilExpiry: Math.ceil((lot.expiryDate!.getTime() - now) / MS_PER_DAY),
    }));
  },

  async valuation(warehouseId?: string): Promise<ValuationSummaryDto> {
    const lots = await stockRepository.valuation(warehouseId);
    const byProduct = new Map<string, { sku: string; name: string; quantity: number; valuationTotal: number }>();

    for (const lot of lots) {
      const existing = byProduct.get(lot.productId) ?? {
        sku: lot.product.sku,
        name: lot.product.name,
        quantity: 0,
        valuationTotal: 0,
      };
      existing.quantity += lot.quantity;
      existing.valuationTotal += lot.quantity * lot.costPrice;
      byProduct.set(lot.productId, existing);
    }

    const lines = Array.from(byProduct.entries()).map(([productId, v]) => ({ productId, ...v }));
    return { lines, grandTotal: lines.reduce((sum, l) => sum + l.valuationTotal, 0) };
  },
};
