import type { Account, BusinessProfile, CarryForward, CashPayment, CashReceipt, Counterparty, TaxBreakdown, TaxDeclaration, TaxPeriod, Transaction } from "@/domain/tax";
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
    deleteCounterparty(code: string): Promise<void>;
  createCashReceipt(receipt: CashReceipt): Promise<Transaction>;
  getAccounts(query?: string, includeInactive?: boolean): Promise<Account[]>;
  createAccount(account: Account): Promise<Account>;
  updateAccount(account: Account): Promise<Account>;
  deactivateAccount(code: string): Promise<Account>;
  updateCashReceipt(receipt: CashReceipt & { id: string }): Promise<Transaction>;
  createCashPayment(payment: CashPayment): Promise<Transaction>;
  updateCashPayment(payment: CashPayment & { id: string }): Promise<Transaction>;
  createCarryForward(voucher: CarryForward): Promise<Transaction>;
  updateCarryForward(voucher: CarryForward & { id: string }): Promise<Transaction>;
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
    deleteCounterparty: (code) => taxRepository.deleteCounterparty(code),
  createCashReceipt: (receipt) => taxRepository.createCashReceipt(receipt),
  getAccounts: (query, includeInactive) => taxRepository.getAccounts(query, includeInactive),
  createAccount: (account) => taxRepository.createAccount(account),
  updateAccount: (account) => taxRepository.updateAccount(account),
  deactivateAccount: (code) => taxRepository.deactivateAccount(code),
  updateCashReceipt: (receipt) => taxRepository.updateCashReceipt(receipt),
  createCashPayment: (payment) => taxRepository.createCashPayment(payment),
  updateCashPayment: (payment) => taxRepository.updateCashPayment(payment),
  createCarryForward: (voucher) => taxRepository.createCarryForward(voucher),
  updateCarryForward: (voucher) => taxRepository.updateCarryForward(voucher),
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
    counterparties: "GET /api/counterparties; GET|PUT|DELETE /api/counterparties/{code}",
    accounts: "GET|POST /api/accounts; PUT|DELETE /api/accounts/{code}",
  cashReceipts: "POST /api/cash-receipts",
  cashPayments: "POST /api/cash-payments; PUT /api/cash-payments/{id}",
  carryForwards: "POST /api/carry-forwards; PUT /api/carry-forwards/{id}",
  calculate: "POST /api/calculate",
  imports: "POST /api/imports",
  exports: "GET /api/exports",
  declarations: "GET|PUT /api/declarations"
} as const;
