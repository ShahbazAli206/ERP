export interface CategoryDto {
  id: string;
  name: string;
  parentId: string | null;
  productCount: number;
}
