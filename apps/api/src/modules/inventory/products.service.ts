import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { productsRepository, type ProductWithLots } from './products.repository';
import type { ProductDetailDto, ProductListItemDto } from './products.dto';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './products.validation';

function stockOnHand(lots: Array<{ quantity: number }>) {
  return lots.reduce((sum, lot) => sum + lot.quantity, 0);
}

function toListItemDto(product: {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  category: { name: string } | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  isActive: boolean;
  inventoryLots: Array<{ quantity: number }>;
}): ProductListItemDto {
  const onHand = stockOnHand(product.inventoryLots);
  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    categoryName: product.category?.name ?? null,
    unit: product.unit,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    reorderLevel: product.reorderLevel,
    stockOnHand: onHand,
    isLowStock: onHand <= product.reorderLevel,
    isActive: product.isActive,
  };
}

function toDetailDto(product: ProductWithLots): ProductDetailDto {
  return {
    ...toListItemDto(product),
    description: product.description,
    imageUrl: product.imageUrl,
    categoryId: product.categoryId,
    lots: product.inventoryLots.map((lot) => ({
      id: lot.id,
      warehouseId: lot.warehouseId,
      warehouseName: lot.warehouse.name,
      lotNumber: lot.lotNumber,
      quantity: lot.quantity,
      costPrice: lot.costPrice,
      expiryDate: lot.expiryDate,
      receivedAt: lot.receivedAt,
    })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function getOrThrow(id: string): Promise<ProductWithLots> {
  const product = await productsRepository.findById(id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  return product;
}

export const productsService = {
  async list(query: ListProductsQuery): Promise<{ items: ProductListItemDto[]; pagination: Pagination }> {
    const { total, products } = await productsRepository.list(query);
    return {
      items: products.map(toListItemDto),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getDetail(id: string): Promise<ProductDetailDto> {
    return toDetailDto(await getOrThrow(id));
  },

  async create(input: CreateProductInput) {
    const existing = await productsRepository.findBySku(input.sku);
    if (existing) {
      throw ApiError.conflict(`A product with SKU "${input.sku}" already exists`);
    }
    const { categoryId, ...rest } = input;
    const created = await productsRepository.create({
      ...rest,
      category: categoryId ? { connect: { id: categoryId } } : undefined,
    });
    return toDetailDto(await getOrThrow(created.id));
  },

  async update(id: string, input: UpdateProductInput) {
    await getOrThrow(id);
    const { categoryId, ...rest } = input;
    const updated = await productsRepository.update(id, {
      ...rest,
      category: categoryId ? { connect: { id: categoryId } } : undefined,
    });
    return toDetailDto(updated);
  },

  async deactivate(id: string) {
    await getOrThrow(id);
    await productsRepository.deactivate(id);
  },
};
