export interface ProductListItemDto {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryName: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  stockOnHand: number;
  isLowStock: boolean;
  isActive: boolean;
}

export interface ProductLotDto {
  id: string;
  warehouseId: string;
  warehouseName: string;
  lotNumber: string;
  quantity: number;
  costPrice: number;
  expiryDate: Date | null;
  receivedAt: Date;
}

export interface ProductDetailDto extends ProductListItemDto {
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  lots: ProductLotDto[];
  createdAt: Date;
  updatedAt: Date;
}
