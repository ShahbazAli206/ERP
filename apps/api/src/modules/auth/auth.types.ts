export interface JwtPayload {
  sub: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export type AuthenticatedUser = JwtPayload;
