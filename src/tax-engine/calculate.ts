import type { BusinessProfile, TaxBreakdown, TaxPeriod, Transaction, Vnd } from "@/domain/tax";
import { getTaxRate } from "./config";

// Tính bằng BigInt để không phát sinh sai số tiền tệ; làm tròn half-up về VND.
const applyBasisPoints = (amount: Vnd, basisPoints: number): Vnd => {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Số tiền phải là số nguyên VND hợp lệ");
  const numerator = BigInt(amount) * BigInt(basisPoints);
  const value = Number((numerator + BigInt(5_000)) / BigInt(10_000));
  if (!Number.isSafeInteger(value)) throw new Error("Kết quả thuế vượt giới hạn số nguyên an toàn");
  return value;
};

export function calculateTax(
  profile: BusinessProfile,
  period: TaxPeriod,
  transactions: Transaction[]
): TaxBreakdown {
  const items = transactions.filter((item) => item.periodId === period.id);
  const revenue = items.filter((item) => item.type === "revenue").reduce((sum, item) => sum + item.amount, 0);
  const expenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const annualRevenue = transactions.filter((item) => item.type === "revenue" && item.date.startsWith(String(period.year))).reduce((sum, item) => sum + item.amount, 0);
  const industries = [...new Set(items.filter((item) => item.type === "revenue").map((item) => item.revenueCategory))];
  const lines = industries.map((industry) => {
    const categoryRevenue = items.filter((item) => item.type === "revenue" && item.revenueCategory === industry).reduce((sum, item) => sum + item.amount, 0);
    const rate = getTaxRate(period.year, industry, annualRevenue);
    return { industry, revenue: categoryRevenue, vatRateBps: rate.vatRateBps, pitRateBps: rate.pitRateBps, vat: applyBasisPoints(categoryRevenue, rate.vatRateBps), pit: applyBasisPoints(categoryRevenue, rate.pitRateBps), ruleId: rate.id };
  });
  const vat = lines.reduce((sum, line) => sum + line.vat, 0);
  const pit = lines.reduce((sum, line) => sum + line.pit, 0);
  const totalTax = vat + pit;

  return {
    periodId: period.id,
    revenue,
    expenses,
    vatRateBps: lines[0]?.vatRateBps ?? 0,
    pitRateBps: lines[0]?.pitRateBps ?? 0,
    vat,
    pit,
    totalTax,
    paid: period.paidAmount,
    remaining: Math.max(totalTax - period.paidAmount, 0),
    formulaVersion: lines.map((line) => line.ruleId).join("+") || `${period.year}-no-revenue`,
    lines,
    calculatedAt: new Date().toISOString()
  };
}
