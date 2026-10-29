import type { Account, AuditEntry, BusinessProfile, CarryForward, CashPayment, CashReceipt, Counterparty, TaxBreakdown, TaxDatabase, TaxDeclaration, TaxPeriod, Transaction } from "@/domain/tax";

export interface TaxRepository {
  login(username: string, password: string): Promise<{ token: string; displayName: string }>;
  getDatabase(): Promise<TaxDatabase>;
  getTaxPeriods(): Promise<TaxPeriod[]>;
  getTransactions(periodId?: string): Promise<Transaction[]>;
  saveProfile(profile: BusinessProfile): Promise<BusinessProfile>;
  savePeriod(period: TaxPeriod): Promise<TaxPeriod>;
  lockPeriod(periodId: string): Promise<TaxPeriod>;
  saveTransaction(transaction: Transaction): Promise<Transaction>;
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
  importTransactions(items: Transaction[]): Promise<{ imported: number }>;
  addAudit(entry: AuditEntry): Promise<void>;
  saveDeclaration(declaration: TaxDeclaration): Promise<TaxDeclaration>;
  calculate(periodId: string): Promise<TaxBreakdown>;
  exportTransactions(periodId: string): Promise<Transaction[]>;
}
