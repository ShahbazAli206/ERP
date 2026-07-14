import type { AccountType } from '../../generated/prisma/enums';

export interface AccountDto {
  id: string;
  code: string;
  name: string;
  type: AccountType;
}
