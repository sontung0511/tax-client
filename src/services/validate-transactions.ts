import type { Transaction } from "@/domain/tax";

export type ValidationCode = "missing" | "invalid" | "duplicate";
export interface TransactionIssue { transactionId: string; code: ValidationCode; message: string }

export function validateTransactions(items: Transaction[]): TransactionIssue[] {
  const issues: TransactionIssue[] = [];
  const seen = new Map<string, string>();
  for (const item of items) {
    if (!item.date || !item.description || (item.type === "revenue" && !item.revenueCategory)) issues.push({ transactionId: item.id, code: "missing", message: "Thiếu ngày, nội dung hoặc nhóm ngành" });
    if (!Number.isSafeInteger(item.amount) || item.amount <= 0 || Number.isNaN(Date.parse(item.date))) issues.push({ transactionId: item.id, code: "invalid", message: "Ngày hoặc số tiền không hợp lệ" });
    if (!Number.isSafeInteger(item.vatAmount ?? 0) || (item.vatAmount ?? 0) < 0) issues.push({ transactionId: item.id, code: "invalid", message: "Tiền thuế GTGT phải là số nguyên VND không âm" });
    if (!item.invoiceNo) issues.push({ transactionId: item.id, code: "missing", message: "Thiếu số hóa đơn/chứng từ" });
    const key = `${item.date}|${item.invoiceNo.trim().toLowerCase()}|${item.amount}`;
    const existing = seen.get(key);
    if (existing) issues.push({ transactionId: item.id, code: "duplicate", message: `Trùng dữ liệu với giao dịch ${existing}` });
    else seen.set(key, item.id);
  }
  return issues;
}
