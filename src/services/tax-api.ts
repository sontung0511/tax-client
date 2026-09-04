import type { Account, BusinessProfile, CashReceipt, Counterparty, TaxBreakdown, TaxDeclaration, TaxPeriod, Transaction } from "@/domain/tax";
import { taxRepository } from "@/repositories";

// Contract duy nhất cho UI; mặc định dùng HTTP backend, local chỉ dành cho demo có chủ đích.
export interface TaxApi {
  login(input: { username: string; password: string }): ReturnType<typeof taxRepository.login>;
  getTaxPeriods(): Promise<TaxPeriod[]>;
  getTransactions(periodId?: string): Promise<Transaction[]>;
  updateProfile(profile: BusinessProfile): Promise<BusinessProfile>;
  createTransaction(transaction: Transaction): Promise<Transaction>;
  updateTransaction(transaction: Transaction): Promise<Transaction>;
  deleteTransaction(transactionId: string): Promise<void>;
    getCounterparties(query?: string): Promise<Counterparty[]>;
    getCounterparty(code: string): Promise<Counterparty>;
    saveCounterparty(counterparty: Counterparty): Promise<Counterparty>;
  createCashReceipt(receipt: CashReceipt): Promise<Transaction>;
  getAccounts(query?: string): Promise<Account[]>;
  updateCashReceipt(receipt: CashReceipt & { id: string }): Promise<Transaction>;
  calculate(periodId: string): Promise<TaxBreakdown>;
  lockPeriod(periodId: string): Promise<TaxPeriod>;
  confirmImport(items: Transaction[]): Promise<{ imported: number }>;
  exportData(periodId: string): Promise<Transaction[]>;
  saveDeclaration(declaration: TaxDeclaration): Promise<TaxDeclaration>;
}

export const taxApi: TaxApi = {
  login: ({ username, password }) => taxRepository.login(username, password),
  getTaxPeriods: () => taxRepository.getTaxPeriods(),
  getTransactions: (periodId) => taxRepository.getTransactions(periodId),
  updateProfile: (profile) => taxRepository.saveProfile(profile),
  createTransaction: (transaction) => taxRepository.saveTransaction(transaction),
  updateTransaction: (transaction) => taxRepository.updateTransaction(transaction),
  deleteTransaction: (transactionId) => taxRepository.deleteTransaction(transactionId),
    getCounterparties: (query) => taxRepository.getCounterparties(query),
    getCounterparty: (code) => taxRepository.getCounterparty(code),
    saveCounterparty: (counterparty) => taxRepository.saveCounterparty(counterparty),
  createCashReceipt: (receipt) => taxRepository.createCashReceipt(receipt),
  getAccounts: (query) => taxRepository.getAccounts(query),
  updateCashReceipt: (receipt) => taxRepository.updateCashReceipt(receipt),
  calculate: (periodId) => taxRepository.calculate(periodId),
  lockPeriod: (periodId) => taxRepository.lockPeriod(periodId),
  confirmImport: (items) => taxRepository.importTransactions(items),
  exportData: (periodId) => taxRepository.exportTransactions(periodId),
  saveDeclaration: (declaration) => taxRepository.saveDeclaration(declaration)
};

export const taxApiContracts = {
  login: "POST /api/login",
  periods: "GET /api/tax-periods",
  transactions: "GET|POST /api/transactions; PUT|DELETE /api/transactions/{id}",
    counterparties: "GET /api/counterparties; GET|PUT /api/counterparties/{code}",
  cashReceipts: "POST /api/cash-receipts",
  calculate: "POST /api/calculate",
  imports: "POST /api/imports",
  exports: "GET /api/exports",
  declarations: "GET|PUT /api/declarations"
} as const;
