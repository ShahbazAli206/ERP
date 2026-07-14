import { ApiError } from '../../shared/ApiError';
import type { Pagination } from '../../shared/response';
import { suppliersRepository } from './suppliers.repository';
import type {
  SupplierContactDto,
  SupplierListItemDto,
  SupplierProfileDto,
} from './suppliers.dto';
import type {
  CreateSupplierInput,
  ListSuppliersQuery,
  SupplierContactInput,
  UpdateSupplierInput,
} from './suppliers.validation';

function toContactDto(contact: {
  id: string;
  name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
}): SupplierContactDto {
  return {
    id: contact.id,
    name: contact.name,
    designation: contact.designation,
    email: contact.email,
    phone: contact.phone,
  };
}

export const suppliersService = {
  async list(
    query: ListSuppliersQuery,
  ): Promise<{ items: SupplierListItemDto[]; pagination: Pagination }> {
    const { total, suppliers } = await suppliersRepository.list(query);
    return {
      items: suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        country: s.country,
        currency: s.currency,
        isActive: s.isActive,
        contactCount: s._count.contacts,
        createdAt: s.createdAt,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total },
    };
  },

  async getProfile(id: string): Promise<SupplierProfileDto> {
    const supplier = await suppliersRepository.findById(id);
    if (!supplier) {
      throw ApiError.notFound('Supplier not found');
    }

    const [products, purchaseHistory, outstandingBalance] = await Promise.all([
      suppliersRepository.distinctProducts(id),
      suppliersRepository.purchaseHistory(id),
      suppliersRepository.outstandingBalance(id),
    ]);

    return {
      id: supplier.id,
      name: supplier.name,
      country: supplier.country,
      currency: supplier.currency,
      address: supplier.address,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      contacts: supplier.contacts.map(toContactDto),
      products,
      purchaseHistory,
      outstandingBalance,
    };
  },

  async create(input: CreateSupplierInput) {
    const { contacts, ...supplierData } = input;
    return suppliersRepository.create({
      ...supplierData,
      contacts: contacts ? { create: contacts } : undefined,
    });
  },

  async update(id: string, input: UpdateSupplierInput) {
    const existing = await suppliersRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Supplier not found');
    }
    return suppliersRepository.update(id, input);
  },

  async deactivate(id: string) {
    const existing = await suppliersRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Supplier not found');
    }
    // Soft delete: suppliers with PO/payment history can't be hard-deleted without breaking
    // referential integrity, and losing that history wouldn't be correct even if they could be.
    await suppliersRepository.deactivate(id);
  },

  async addContact(supplierId: string, input: SupplierContactInput) {
    const existing = await suppliersRepository.findById(supplierId);
    if (!existing) {
      throw ApiError.notFound('Supplier not found');
    }
    const contact = await suppliersRepository.addContact(supplierId, input);
    return toContactDto(contact);
  },

  async removeContact(supplierId: string, contactId: string) {
    const existing = await suppliersRepository.findById(supplierId);
    if (!existing) {
      throw ApiError.notFound('Supplier not found');
    }
    const contact = existing.contacts.find((c) => c.id === contactId);
    if (!contact) {
      throw ApiError.notFound('Contact not found');
    }
    await suppliersRepository.removeContact(contactId);
  },
};
