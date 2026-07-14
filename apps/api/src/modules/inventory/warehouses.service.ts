import { ApiError } from '../../shared/ApiError';
import { warehousesRepository } from './warehouses.repository';
import type { CreateWarehouseInput, UpdateWarehouseInput } from './warehouses.validation';

export const warehousesService = {
  list() {
    return warehousesRepository.list();
  },

  create(input: CreateWarehouseInput) {
    return warehousesRepository.create(input);
  },

  async update(id: string, input: UpdateWarehouseInput) {
    const existing = await warehousesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Warehouse not found');
    }
    return warehousesRepository.update(id, input);
  },

  async delete(id: string) {
    const existing = await warehousesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Warehouse not found');
    }
    const lotCount = await warehousesRepository.countLots(id);
    if (lotCount > 0) {
      throw ApiError.conflict('Cannot delete a warehouse that still has inventory lots');
    }
    await warehousesRepository.delete(id);
  },
};
