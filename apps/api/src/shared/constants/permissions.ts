export const MODULES = [
  'auth',
  'suppliers',
  'procurement',
  'shipments',
  'inventory',
  'distributors',
  'sales',
  'finance',
  'expenses',
  'tax',
  'dashboard',
  'reports',
  'notifications',
  'ai',
  'settings',
] as const;

export const CRUD_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export const EXTRA_PERMISSIONS: Record<string, string[]> = {
  procurement: ['approve'],
};

export function permissionKey(module: string, action: string) {
  return `${module}:${action}`;
}

export function allPermissionKeys(): string[] {
  const keys: string[] = [];
  for (const module of MODULES) {
    for (const action of CRUD_ACTIONS) {
      keys.push(permissionKey(module, action));
    }
    for (const action of EXTRA_PERMISSIONS[module] ?? []) {
      keys.push(permissionKey(module, action));
    }
  }
  return keys;
}

const crud = (module: string) => CRUD_ACTIONS.map((action) => permissionKey(module, action));
const view = (module: string) => permissionKey(module, 'view');

export const ROLE_NAMES = {
  SUPER_ADMIN: 'Super Admin',
  PROCUREMENT_OFFICER: 'Procurement Officer',
  INVENTORY_MANAGER: 'Inventory Manager',
  SALES_MANAGER: 'Sales Manager',
  ACCOUNTANT: 'Accountant',
  EXECUTIVE: 'Executive',
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLE_NAMES.SUPER_ADMIN]: allPermissionKeys(),
  [ROLE_NAMES.PROCUREMENT_OFFICER]: [
    ...crud('procurement'),
    permissionKey('procurement', 'approve'),
    ...crud('suppliers'),
    ...crud('shipments'),
    view('inventory'),
    view('dashboard'),
    view('reports'),
  ],
  [ROLE_NAMES.INVENTORY_MANAGER]: [
    ...crud('inventory'),
    view('procurement'),
    view('shipments'),
    view('suppliers'),
    view('dashboard'),
    view('reports'),
  ],
  [ROLE_NAMES.SALES_MANAGER]: [
    ...crud('sales'),
    ...crud('distributors'),
    view('inventory'),
    view('dashboard'),
    view('reports'),
  ],
  [ROLE_NAMES.ACCOUNTANT]: [
    ...crud('finance'),
    ...crud('expenses'),
    ...crud('tax'),
    ...crud('reports'),
    view('dashboard'),
  ],
  [ROLE_NAMES.EXECUTIVE]: MODULES.map((module) => view(module)),
};
