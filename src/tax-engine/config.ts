import type { IndustryCode } from "@/domain/tax";

export interface TaxRateConfig {
  id: string;
  effectiveFrom: string;
  effectiveTo?: string;
  minAnnualRevenueVnd: number;
  maxAnnualRevenueVnd?: number;
  vatRateBps: number;
  pitRateBps: number;
  label: string;
}

// 100 bps = 1%. Tỷ lệ minh họa; phải được nghiệp vụ/pháp chế xác nhận trước production.
export const taxConfig: Record<number, Record<IndustryCode, TaxRateConfig>> = {
  2026: {
    distribution: { id: "2026-distribution-r1", effectiveFrom: "2026-01-01", minAnnualRevenueVnd: 0, vatRateBps: 100, pitRateBps: 50, label: "Phân phối, cung cấp hàng hóa" },
    services: { id: "2026-services-r1", effectiveFrom: "2026-01-01", minAnnualRevenueVnd: 0, vatRateBps: 500, pitRateBps: 200, label: "Dịch vụ, xây dựng không bao thầu NVL" },
    production: { id: "2026-production-r1", effectiveFrom: "2026-01-01", minAnnualRevenueVnd: 0, vatRateBps: 300, pitRateBps: 150, label: "Sản xuất, vận tải, dịch vụ gắn với hàng hóa" },
    other: { id: "2026-other-r1", effectiveFrom: "2026-01-01", minAnnualRevenueVnd: 0, vatRateBps: 200, pitRateBps: 100, label: "Hoạt động kinh doanh khác" }
  }
};

export const getTaxRate = (year: number, industry: IndustryCode, annualRevenue: number) => {
  const yearly = taxConfig[year];
  if (!yearly) throw new Error(`Chưa cấu hình công thức thuế cho năm ${year}`);
  const rule = yearly[industry];
  if (annualRevenue < rule.minAnnualRevenueVnd || (rule.maxAnnualRevenueVnd !== undefined && annualRevenue > rule.maxAnnualRevenueVnd)) throw new Error("Doanh thu nằm ngoài ngưỡng cấu hình thuế");
  return rule;
};
