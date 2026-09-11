import { seedDatabase } from "@/domain/mock-data";
import type { Account, AuditEntry, BusinessProfile, CashPayment, CashReceipt, Counterparty, TaxDatabase, TaxDeclaration, TaxPeriod, Transaction } from "@/domain/tax";
import type { TaxRepository } from "./tax-repository";
import { calculateTax } from "@/tax-engine/calculate";

const STORAGE_KEY = "tax-client.database.v2";
const AUTH_KEY = "tax-client.auth.v1";

const cloneSeed = (): TaxDatabase => JSON.parse(JSON.stringify(seedDatabase)) as TaxDatabase;

export class LocalTaxRepository implements TaxRepository {
  private read(): TaxDatabase {
    if (typeof window === "undefined") return cloneSeed();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = cloneSeed();
      this.write(initial);
      return initial;
    }
    try {
      const parsed = JSON.parse(raw) as TaxDatabase;
      parsed.profile.taxpayerType ??= "household";
      parsed.profile.householdTaxMethod ??= "revenue_percentage";
      parsed.declarations ??= cloneSeed().declarations;
        parsed.counterparties ??= [];
      parsed.transactions = parsed.transactions.map((item) => ({ ...item, revenueCategory: item.revenueCategory ?? parsed.profile.industry, vatAmount: item.vatAmount ?? 0, paymentStatus: item.paymentStatus ?? "paid", outstandingAmount: item.outstandingAmount ?? 0 }));
      return parsed;
    } catch {
      const initial = cloneSeed();
      this.write(initial);
      return initial;
    }
  }

  private write(data: TaxDatabase) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async login(username: string, password: string) {
    if (username !== "demo" || password !== "demo123") throw new Error("Tài khoản hoặc mật khẩu không đúng");
    const session = { token: "mock-session-token", displayName: "Nguyễn Minh An" };
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  }

  async getDatabase() { return this.read(); }
  async getTaxPeriods() { return this.read().periods; }
  async getTransactions(periodId?: string) { const items = this.read().transactions; return periodId ? items.filter((item) => item.periodId === periodId) : items; }

  async saveProfile(profile: BusinessProfile) {
    const data = this.read();
    data.profile = profile;
    this.write(data);
    return profile;
  }

  async savePeriod(period: TaxPeriod) {
    const data = this.read();
    data.periods = data.periods.some((item) => item.id === period.id)
      ? data.periods.map((item) => item.id === period.id ? period : item)
      : [period, ...data.periods];
    this.write(data);
    return period;
  }

  async lockPeriod(periodId: string) {
    const data = this.read();
    const period = data.periods.find((item) => item.id === periodId);
    if (!period) throw new Error("Không tìm thấy kỳ kê khai");
    if (period.lockedAt) return period;
    const { calculateTax } = await import("@/tax-engine/calculate");
    period.taxSnapshot = calculateTax(data.profile, period, data.transactions);
    period.lockedAt = new Date().toISOString();
    period.status = "completed";
    data.audit.unshift({ id: crypto.randomUUID(), at: period.lockedAt, action: "Khóa kỳ kê khai", detail: `${period.label} · công thức ${period.taxSnapshot.formulaVersion}` });
    this.write(data);
    return period;
  }

  async saveTransaction(transaction: Transaction) {
    const data = this.read();
    if (data.periods.find((item) => item.id === transaction.periodId)?.lockedAt) throw new Error("Kỳ đã khóa, không thể thêm hoặc sửa giao dịch");
    data.transactions = data.transactions.some((item) => item.id === transaction.id)
      ? data.transactions.map((item) => item.id === transaction.id ? transaction : item)
      : [transaction, ...data.transactions];
    data.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), action: "Cập nhật giao dịch", detail: `${transaction.description} · ${transaction.amount} VND` });
    this.write(data);
    return transaction;
  }

  async updateTransaction(transaction: Transaction) { return this.saveTransaction(transaction); }

  async deleteTransaction(transactionId: string) {
    const data = this.read(); const transaction = data.transactions.find((item) => item.id === transactionId);
    if (!transaction) throw new Error("Không tìm thấy giao dịch");
    if (data.periods.find((item) => item.id === transaction.periodId)?.lockedAt) throw new Error("Không thể xóa giao dịch của kỳ đã khóa");
    data.transactions = data.transactions.filter((item) => item.id !== transactionId);
    data.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), action: "Xóa giao dịch", detail: `${transaction.description} · ${transaction.amount} VND` });
    this.write(data);
  }

  async getCounterparties(query?: string) {
      const needle = query?.trim().toLowerCase() ?? "";
      return (this.read().counterparties ?? []).filter((item) => !needle || item.code.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle));
    }

    async getCounterparty(code: string) {
      const item = (this.read().counterparties ?? []).find((counterparty) => counterparty.code === code);
      if (!item) throw new Error("Không tìm thấy đối tượng");
      return item;
    }

    async saveCounterparty(counterparty: Counterparty) {
      const data = this.read();
      data.counterparties = (data.counterparties ?? []).filter((item) => item.code !== counterparty.code);
      data.counterparties.unshift(counterparty);
      this.write(data);
      return counterparty;
    }

    async createCashReceipt(receipt: CashReceipt) {
      const data = this.read();
      if (!data.periods.some((period) => period.id === receipt.periodId)) throw new Error("Không tìm thấy kỳ kê khai");
    if (!isValidReceiptDate(receipt.voucherDate) || !isValidReceiptDate(receipt.accountingDate) || !receipt.receiptNo.trim() || !receipt.counterpartyCode.trim() || !receipt.counterpartyName.trim() || !receipt.description.trim() || !isValidReceiptAmount(receipt.amount) || !receipt.convertedAmount || !receipt.debitAccount || !receipt.creditAccount) {
        throw new Error("Vui lòng nhập đủ thông tin phiếu thu và số tiền hợp lệ");
      }
      if (receipt.saveCounterparty) await this.saveCounterparty({ code: receipt.counterpartyCode.trim(), name: receipt.counterpartyName.trim(), taxCode: receipt.counterpartyTaxCode.trim(), address: receipt.counterpartyAddress.trim() });
    const vatAmount = (receipt.entries ?? []).filter((entry) => entry.kind === "vat").reduce((sum, entry) => sum + entry.amount, 0);
    return this.saveTransaction({ id: crypto.randomUUID(), periodId: receipt.periodId, date: receipt.voucherDate, type: "revenue", description: receipt.description.trim(), invoiceNo: receipt.receiptNo.trim(), documentNo: receipt.receiptNo.trim(), amount: receipt.convertedAmount, vatAmount, revenueCategory: receipt.revenueCategory, paymentStatus: "paid", outstandingAmount: 0, voucherType: "cash_receipt", counterpartyCode: receipt.counterpartyCode.trim(), counterpartyName: receipt.counterpartyName.trim(), counterpartyTaxCode: receipt.counterpartyTaxCode.trim(), counterpartyAddress: receipt.counterpartyAddress.trim(), cashReceipt: { voucherDate: receipt.voucherDate, accountingDate: receipt.accountingDate, status: receipt.status, contactName: receipt.contactName, debitAccount: receipt.debitAccount, creditAccount: receipt.creditAccount, currency: receipt.currency, exchangeRate: receipt.exchangeRate, convertedAmount: receipt.convertedAmount, amountIncludesVAT: receipt.amountIncludesVAT, invoiceNo: receipt.invoiceNo, invoiceSymbol: receipt.invoiceSymbol, invoiceDate: receipt.invoiceDate, detailCode: receipt.detailCode, quantity: receipt.quantity, unitPrice: receipt.unitPrice, caseCode: receipt.caseCode, collector: receipt.collector, note: receipt.note, attachments: receipt.attachments, entries: receipt.entries, invoices: receipt.invoices, taxLines: receipt.taxLines } });
  }

  async getAccounts(query?: string): Promise<Account[]> {
    const needle = query?.trim().toLowerCase() ?? "";
    return (this.read().accounts ?? []).filter((item) => !needle || item.code.includes(needle) || item.name.toLowerCase().includes(needle));
  }

  async updateCashReceipt(receipt: CashReceipt & { id: string }) {
    const created = await this.createCashReceipt({ ...receipt, id: undefined });
    const data = this.read(); data.transactions = data.transactions.filter((item) => item.id !== receipt.id); this.write(data);
    return created;
  }

  async createCashPayment(payment: CashPayment) {
    const data = this.read();
    if (!data.periods.some((period) => period.id === payment.periodId)) throw new Error("Không tìm thấy kỳ kê khai");
    if (!isValidReceiptDate(payment.voucherDate) || !isValidReceiptDate(payment.postingDate) || !payment.paymentNo.trim() || !payment.recipientName.trim() || !payment.description.trim() || !isValidReceiptAmount(payment.amount) || !/^\d{3,10}$/.test(payment.debitAccount) || !/^\d{3,10}$/.test(payment.creditAccount)) {
      throw new Error("Vui lòng nhập đủ thông tin phiếu chi, tài khoản Nợ/Có và số tiền hợp lệ");
    }
    if (payment.savePayee && payment.recipientCode.trim()) await this.saveCounterparty({ code: payment.recipientCode.trim(), name: payment.recipientName.trim(), taxCode: payment.recipientTaxCode.trim(), address: payment.recipientAddress.trim() });
    return this.saveTransaction({ id: crypto.randomUUID(), periodId: payment.periodId, date: payment.voucherDate, type: "expense", description: payment.description.trim(), invoiceNo: payment.invoiceNo, documentNo: payment.paymentNo.trim(), amount: payment.amount, vatAmount: 0, revenueCategory: "other", paymentStatus: "paid", outstandingAmount: 0, voucherType: "cash_payment", counterpartyCode: payment.recipientCode.trim(), counterpartyName: payment.recipientName.trim(), counterpartyTaxCode: payment.recipientTaxCode.trim(), counterpartyAddress: payment.recipientAddress.trim(), cashPayment: { status: payment.status, month: payment.month, ctgsNo: payment.ctgsNo, postingDate: payment.postingDate, voucherDate: payment.voucherDate, relatedDocumentNo: payment.relatedDocumentNo, invoiceType: payment.invoiceType, invoiceNo: payment.invoiceNo, invoiceSerial: payment.invoiceSerial, invoiceDate: payment.invoiceDate, unitName: payment.unitName, unitAddress: payment.unitAddress, itemName: payment.itemName, warehouseCode: payment.warehouseCode, debitAccount: payment.debitAccount, debitSub1: payment.debitSub1, debitSub2: payment.debitSub2, creditAccount: payment.creditAccount, creditSub1: payment.creditSub1, creditSub2: payment.creditSub2, caseCode: payment.caseCode, quantity: payment.quantity, unitPrice: payment.unitPrice, currency: payment.currency, exchangeRate: payment.exchangeRate, endingStock: payment.endingStock, note: payment.note, attachments: payment.attachments } });
  }

  async updateCashPayment(payment: CashPayment & { id: string }) {
    const created = await this.createCashPayment({ ...payment, id: undefined });
    const data = this.read(); data.transactions = data.transactions.filter((item) => item.id !== payment.id); this.write(data);
    return created;
  }

  async importTransactions(items: Transaction[]) {
    const data = this.read();
    const lockedPeriod = items.find((item) => data.periods.find((period) => period.id === item.periodId)?.lockedAt);
    if (lockedPeriod) throw new Error("Không thể import vào kỳ đã khóa");
    data.transactions = [...items, ...data.transactions];
    data.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), action: "Import Excel", detail: `Đã nhập ${items.length} giao dịch` });
    this.write(data);
    return { imported: items.length };
  }

  async addAudit(entry: AuditEntry) {
    const data = this.read();
    data.audit.unshift(entry);
    this.write(data);
  }

  async saveDeclaration(declaration: TaxDeclaration) {
    const data = this.read();
    if (data.declarations.find((item) => item.id === declaration.id)?.lockedAt) throw new Error("Tờ khai đã khóa");
    data.declarations = data.declarations.map((item) => item.id === declaration.id ? declaration : item);
    data.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), action: "Cập nhật tờ khai doanh nghiệp", detail: `${declaration.formCode} · ${declaration.periodLabel}` });
    this.write(data);
    return declaration;
  }

  async calculate(periodId: string) {
    const data = this.read(); const period = data.periods.find((item) => item.id === periodId);
    if (!period) throw new Error("Không tìm thấy kỳ kê khai");
    return period.taxSnapshot ?? calculateTax(data.profile, period, data.transactions);
  }

  async exportTransactions(periodId: string) { return this.read().transactions.filter((item) => item.periodId === periodId); }
}

export const localTaxRepository: TaxRepository = new LocalTaxRepository();

function isValidReceiptAmount(value: number) { return Number.isSafeInteger(value) && value > 0; }

function isValidReceiptDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
