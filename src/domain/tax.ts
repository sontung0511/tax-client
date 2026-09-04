export type Vnd = number;
export type PeriodStatus = "draft" | "review" | "completed";
export type PeriodKind = "month" | "quarter";
export type IndustryCode = "distribution" | "services" | "production" | "other";

export interface BusinessProfile {
  taxpayerType: "household" | "enterprise";
  taxCode: string;
  businessName: string;
  ownerName: string;
  address: string;
  industry: IndustryCode;
  declarationKind: PeriodKind;
  enterpriseType?: "limited" | "joint_stock" | "private" | "partnership";
  legalRepresentative?: string;
  vatMethod?: "deduction" | "direct";
  accountingRegime?: "circular_200" | "circular_133";
  householdTaxMethod?: "non_taxable" | "revenue_percentage" | "taxable_income";
}

export type DeclarationTaxType = "vat" | "pit" | "cit";
export interface TaxDeclaration {
  id: string;
  taxType: DeclarationTaxType;
  formCode: string;
  formName: string;
  periodLabel: string;
  periodType: PeriodKind | "year";
  status: "draft" | "valid" | "locked";
  schemaVersion: string;
  values: Record<string, string | Vnd>;
  updatedAt: string;
  lockedAt?: string;
}

export interface TaxPeriod {
  id: string;
  label: string;
  year: number;
  kind: PeriodKind;
  status: PeriodStatus;
  dueDate: string;
  paidAmount: Vnd;
  lockedAt?: string;
  taxSnapshot?: TaxBreakdown;
}

export interface Transaction {
  id: string;
  periodId: string;
  date: string;
  type: "revenue" | "expense";
  description: string;
  invoiceNo: string;
  amount: Vnd;
  vatAmount: Vnd;
  revenueCategory: IndustryCode;
  documentNo?: string;
  paymentStatus?: "paid" | "unpaid";
  outstandingAmount?: Vnd;
    voucherType?: "cash_receipt";
    counterpartyCode?: string;
    counterpartyName?: string;
    counterpartyTaxCode?: string;
    counterpartyAddress?: string;
    cashReceipt?: CashReceiptData;
}

export interface Counterparty {
  code: string;
  name: string;
  taxCode: string;
  address: string;
}
export interface Account { code: string; name: string; parentCode?: string; isActive: boolean; }

export interface CashReceipt {
  id?: string;
  periodId: string;
  voucherDate: string;
  accountingDate: string;
  status: "draft" | "saved";
  receiptNo: string;
  counterpartyCode: string;
  counterpartyName: string;
  counterpartyTaxCode: string;
  counterpartyAddress: string;
  description: string;
  contactName: string;
  debitAccount: string;
  creditAccount: string;
  amount: Vnd;
  currency: string;
  exchangeRate: number;
  convertedAmount: Vnd;
  revenueCategory: IndustryCode;
  invoiceNo: string;
  invoiceDate: string;
  caseCode: string;
  collector: string;
  note: string;
  attachments: ReceiptAttachment[];
  saveCounterparty: boolean;
}

export interface ReceiptAttachment { name: string; type: string; size: number; data: string; }
export interface CashReceiptData extends Omit<CashReceipt, "id" | "periodId" | "receiptNo" | "counterpartyCode" | "counterpartyName" | "counterpartyTaxCode" | "counterpartyAddress" | "description" | "amount" | "revenueCategory" | "saveCounterparty"> {}

export interface TaxLine {
  industry: IndustryCode;
  revenue: Vnd;
  vatRateBps: number;
  pitRateBps: number;
  vat: Vnd;
  pit: Vnd;
  ruleId: string;
}

export interface TaxBreakdown {
  periodId: string;
  revenue: Vnd;
  expenses: Vnd;
  vatRateBps: number;
  pitRateBps: number;
  vat: Vnd;
  pit: Vnd;
  totalTax: Vnd;
  paid: Vnd;
  remaining: Vnd;
  formulaVersion: string;
  lines: TaxLine[];
  calculatedAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  detail: string;
}

export interface TaxDatabase {
  profile: BusinessProfile;
  periods: TaxPeriod[];
  transactions: Transaction[];
    counterparties?: Counterparty[];
    accounts?: Account[];
  audit: AuditEntry[];
  declarations: TaxDeclaration[];
}

export const formatVnd = (value: Vnd) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

export const parseVnd = (value: string): Vnd => {
  const digits = value.replace(/\D/g, "");
  const amount = digits ? Number.parseInt(digits, 10) : 0;
  return Number.isSafeInteger(amount) ? amount : 0;
};
