export interface RoleWithPermissionsDto {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
}
