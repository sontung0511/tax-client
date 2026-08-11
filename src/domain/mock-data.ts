import type { TaxDatabase } from "./tax";

export const seedDatabase: TaxDatabase = {
  profile: {
    taxpayerType: "household",
    taxCode: "0312345678",
    businessName: "Hộ kinh doanh An Nhiên",
    ownerName: "Nguyễn Minh An",
    address: "24 Nguyễn Văn Trỗi, Phú Nhuận, TP.HCM",
    industry: "distribution",
    declarationKind: "quarter",
    householdTaxMethod: "revenue_percentage"
  },
  periods: [
    { id: "2026-q3", label: "Quý 3/2026", year: 2026, kind: "quarter", status: "draft", dueDate: "2026-10-31", paidAmount: 0 },
    { id: "2026-q2", label: "Quý 2/2026", year: 2026, kind: "quarter", status: "draft", dueDate: "2026-07-31", paidAmount: 0 },
    { id: "2026-q1", label: "Quý 1/2026", year: 2026, kind: "quarter", status: "draft", dueDate: "2026-04-30", paidAmount: 0 }
  ],
  transactions: [],
  audit: [],
  declarations: [
    { id: "vat-2026-q3", taxType: "vat", formCode: "01/GTGT", formName: "Tờ khai thuế giá trị gia tăng", periodLabel: "Quý 3/2026", periodType: "quarter", status: "draft", schemaVersion: "TT80-01GTGT-draft", values: { outputVat: 0, deductibleInputVat: 0, payableVat: 0 }, updatedAt: "2026-08-11T00:00:00.000Z" },
    { id: "pit-2026-q3", taxType: "pit", formCode: "05/KK-TNCN", formName: "Tờ khai khấu trừ thuế thu nhập cá nhân", periodLabel: "Quý 3/2026", periodType: "quarter", status: "draft", schemaVersion: "TT80-05KKTNCN-draft", values: { employees: 0, taxableIncome: 0, withheldTax: 0 }, updatedAt: "2026-08-11T00:00:00.000Z" },
    { id: "cit-2026", taxType: "cit", formCode: "03/TNDN", formName: "Tờ khai quyết toán thuế thu nhập doanh nghiệp", periodLabel: "Năm 2026", periodType: "year", status: "draft", schemaVersion: "TT80-03TNDN-draft", values: { revenue: 0, deductibleExpenses: 0, taxableIncome: 0, payableTax: 0 }, updatedAt: "2026-08-11T00:00:00.000Z" }
  ]
};
