import type { BusinessProfile, TaxBreakdown, TaxDeclaration, TaxPeriod, Transaction } from "@/domain/tax";
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
  calculate: "POST /api/calculate",
  imports: "POST /api/imports",
  exports: "GET /api/exports",
  declarations: "GET|PUT /api/declarations"
} as const;
