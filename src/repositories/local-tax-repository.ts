import { seedDatabase } from "@/domain/mock-data";
import type { AuditEntry, BusinessProfile, TaxDatabase, TaxDeclaration, TaxPeriod, Transaction } from "@/domain/tax";
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
      parsed.transactions = parsed.transactions.map((item) => ({ ...item, revenueCategory: item.revenueCategory ?? parsed.profile.industry, paymentStatus: item.paymentStatus ?? "paid", outstandingAmount: item.outstandingAmount ?? 0 }));
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

  async deleteTransaction(transactionId: string) {
    const data = this.read(); const transaction = data.transactions.find((item) => item.id === transactionId);
    if (!transaction) throw new Error("Không tìm thấy giao dịch");
    if (data.periods.find((item) => item.id === transaction.periodId)?.lockedAt) throw new Error("Không thể xóa giao dịch của kỳ đã khóa");
    data.transactions = data.transactions.filter((item) => item.id !== transactionId);
    data.audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), action: "Xóa giao dịch", detail: `${transaction.description} · ${transaction.amount} VND` });
    this.write(data);
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
