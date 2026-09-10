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
    voucherType?: "cash_receipt" | "cash_payment";
    counterpartyCode?: string;
    counterpartyName?: string;
    counterpartyTaxCode?: string;
    counterpartyAddress?: string;
    cashReceipt?: CashReceiptData;
    cashPayment?: CashPaymentData;
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
  amountIncludesVAT?: boolean;
  currency: string;
  exchangeRate: number;
  convertedAmount: Vnd;
  revenueCategory: IndustryCode;
  invoiceNo: string;
  invoiceSymbol?: string;
  invoiceDate: string;
  detailCode?: string;
  quantity?: string;
  unitPrice?: Vnd;
  caseCode: string;
  collector: string;
  note: string;
  attachments: ReceiptAttachment[];
  entries?: ReceiptAccountingEntry[];
  invoices?: ReceiptInvoice[];
  taxLines?: ReceiptTaxLine[];
  saveCounterparty: boolean;
}

export interface ReceiptAttachment { name: string; type: string; size: number; data: string; }
export interface ReceiptAccountingEntry { id?: string; voucherId?: string; invoiceId?: string; debitAccount: string; creditAccount: string; amount: Vnd; description: string; kind: "normal" | "vat" | "cogs"; rate?: number; detailCode?: string; quantity?: string; unitPrice?: Vnd; revenueDetailId?: string; }
export interface ReceiptInvoice { id?: string; voucherId?: string; invoiceNo: string; symbol: string; invoiceDate: string; taxCode: string; }
export interface ReceiptTaxLine { id?: string; voucherId?: string; invoiceId?: string; revenueDetailId?: string; taxRate: number; taxableAmount: Vnd; taxAmount: Vnd; priceIncludesTax: boolean; }
type CashReceiptDetailFields = "amountIncludesVAT" | "invoiceSymbol" | "detailCode" | "quantity" | "unitPrice" | "entries" | "invoices" | "taxLines";
export type CashReceiptData = Omit<CashReceipt, "id" | "periodId" | "receiptNo" | "counterpartyCode" | "counterpartyName" | "counterpartyTaxCode" | "counterpartyAddress" | "description" | "amount" | "revenueCategory" | "saveCounterparty" | CashReceiptDetailFields> & Partial<Pick<CashReceipt, CashReceiptDetailFields>>;

export interface CashPayment {
  id?: string;
  periodId: string;
  status: "draft" | "saved";
  month: string;
  ctgsNo: string;
  postingDate: string;
  voucherDate: string;
  paymentNo: string;
  recipientCode: string;
  recipientName: string;
  recipientTaxCode: string;
  recipientAddress: string;
  relatedDocumentNo: string;
  description: string;
  invoiceType: string;
  invoiceNo: string;
  invoiceSerial: string;
  invoiceDate: string;
  unitName: string;
  unitAddress: string;
  itemName: string;
  warehouseCode: string;
  debitAccount: string;
  debitSub1: string;
  debitSub2: string;
  creditAccount: string;
  creditSub1: string;
  creditSub2: string;
  caseCode: string;
  quantity: number;
  unitPrice: Vnd;
  currency: string;
  exchangeRate: number;
  amount: Vnd;
  endingStock: string;
  note: string;
  attachments: ReceiptAttachment[];
  savePayee: boolean;
}

export interface CashPaymentData extends Omit<CashPayment, "id" | "periodId" | "paymentNo" | "recipientCode" | "recipientName" | "recipientTaxCode" | "recipientAddress" | "description" | "amount" | "savePayee"> {}

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
