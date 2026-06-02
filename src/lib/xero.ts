// Xero MCP data types and fetch helpers (server-side only)

export interface FinancialPosition {
  snapshot_date: string;
  total_assets: number;
  total_liabilities: number;
  net_equity: number;
  cash_balance: number;
  current_assets: number;
  current_liabilities: number;
}

export interface ProfitAndLoss {
  period: { start_date: string; end_date: string };
  total_income: number;
  total_expenses: number;
  gross_profit: number;
  net_profit: number;
  income_accounts: { account_name: string; current_balance: number; comparison_balance: number }[];
  expense_accounts: { account_name: string; current_balance: number; comparison_balance: number }[];
}

export interface CashPosition {
  snapshot_date: string;
  cash_balance: number;
  amount_owed: number;
  amount_due: number;
  working_capital: number;
}

export interface FinanceDashboardData {
  org_name: string;
  currency: string;
  position: FinancialPosition;
  pnl: ProfitAndLoss;
  cash: CashPosition;
  last_refreshed: string;
}
