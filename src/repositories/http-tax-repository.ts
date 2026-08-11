import type { AuditEntry, BusinessProfile, TaxBreakdown, TaxDatabase, TaxDeclaration, TaxPeriod, Transaction } from "@/domain/tax";
import type { TaxRepository } from "./tax-repository";

const AUTH_KEY = "tax-client.auth.v1";

export class HttpTaxRepository implements TaxRepository {
  constructor(private readonly baseUrl: string) {}

  private token() {
    if (typeof window === "undefined") return "";
    try { return (JSON.parse(window.localStorage.getItem(AUTH_KEY) ?? "{}") as { token?: string }).token ?? ""; }
    catch { return ""; }
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: { "Content-Type": "application/json", ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {}), ...init?.headers }
      });
    } catch {
      throw new Error(`Không kết nối được backend tại ${this.baseUrl}. Hãy chạy tax-service-backend trên cổng 8080.`);
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      throw new Error(payload?.error?.message ?? `API trả về HTTP ${response.status}`);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async login(username: string, password: string) {
    const session = await this.request<{ token: string; displayName: string }>("/api/login", { method: "POST", body: JSON.stringify({ username, password }) });
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  }
  getDatabase() { return this.request<TaxDatabase>("/api/database"); }
  getTaxPeriods() { return this.request<TaxPeriod[]>("/api/tax-periods"); }
  getTransactions(periodId?: string) { return this.request<Transaction[]>(`/api/transactions${periodId ? `?periodId=${encodeURIComponent(periodId)}` : ""}`); }
  saveProfile(profile: BusinessProfile) { return this.request<BusinessProfile>("/api/profile", { method: "PUT", body: JSON.stringify(profile) }); }
  savePeriod(period: TaxPeriod) { return this.request<TaxPeriod>("/api/tax-periods", { method: "POST", body: JSON.stringify(period) }); }
  lockPeriod(periodId: string) { return this.request<TaxPeriod>(`/api/tax-periods/${encodeURIComponent(periodId)}/lock`, { method: "POST" }); }
  saveTransaction(transaction: Transaction) { return this.request<Transaction>("/api/transactions", { method: "POST", body: JSON.stringify(transaction) }); }
  deleteTransaction(transactionId: string) { return this.request<void>(`/api/transactions/${encodeURIComponent(transactionId)}`, { method: "DELETE" }); }
  importTransactions(items: Transaction[]) { return this.request<{ imported: number }>("/api/imports", { method: "POST", body: JSON.stringify({ items }) }); }
  saveDeclaration(declaration: TaxDeclaration) { return this.request<TaxDeclaration>(`/api/declarations/${encodeURIComponent(declaration.id)}`, { method: "PUT", body: JSON.stringify(declaration) }); }
  calculate(periodId: string) { return this.request<TaxBreakdown>("/api/calculate", { method: "POST", body: JSON.stringify({ periodId }) }); }
  async exportTransactions(periodId: string) {
    const payload = await this.request<{ transactions: Transaction[] }>(`/api/exports?periodId=${encodeURIComponent(periodId)}`);
    return payload.transactions;
  }
  async addAudit(_entry: AuditEntry) { throw new Error("Audit chỉ được backend tạo từ thao tác nghiệp vụ"); }
}
