export interface ReceivableDto {
  distributorId: string;
  name: string;
  outstandingBalance: number;
}

export interface PayableDto {
  supplierId: string;
  name: string;
  outstandingBalance: number;
}

export interface CashPositionDto {
  totalBalance: number;
}

export interface ProfitLossDto {
  income: number;
  cogs: number;
  expenses: number;
  netProfit: number;
}

export interface BalanceSheetDto {
  assets: number;
  liabilities: number;
  equity: number;
}

export interface CashFlowDayDto {
  date: string;
  incoming: number;
  outgoing: number;
  net: number;
}

export interface CashFlowDto {
  incoming: number;
  outgoing: number;
  netCashFlow: number;
  byDate: CashFlowDayDto[];
}
