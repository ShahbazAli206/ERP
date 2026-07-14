import { settingsRolesRepository } from './roles.repository';
import type { RoleWithPermissionsDto } from './roles.dto';

export const settingsRolesService = {
  async list(): Promise<RoleWithPermissionsDto[]> {
    const roles = await settingsRolesRepository.list();
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rp) => rp.permission.key),
    }));
  },
};
