"use client";

import { formatVnd, parseVnd, type BusinessProfile, type TaxBreakdown, type TaxDatabase, type TaxDeclaration, type Transaction } from "@/domain/tax";
import { taxApi } from "@/services/tax-api";
import { calculateTax } from "@/tax-engine/calculate";
import { validateTransactions } from "@/services/validate-transactions";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { View } from "./sidebar";

const statusLabel = { draft: "Đang nhập", review: "Chờ duyệt", completed: "Hoàn tất" };
const statusStyle = { draft: "bg-amber-50 text-amber-700", review: "bg-blue-50 text-blue-700", completed: "bg-emerald-50 text-emerald-700" };
const periodStatusLabel = (period: TaxDatabase["periods"][number], transactions: Transaction[]) => period.lockedAt ? "Đã khóa" : period.status === "draft" && !transactions.some(item => item.periodId === period.id) ? "Chưa nhập" : statusLabel[period.status];

function Header({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <header className="mb-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-pine">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>}</header>;
}

function Dashboard({ data, go }: { data: TaxDatabase; go: (view: View) => void }) {
  if (data.profile.taxpayerType === "enterprise") {
    const valid = data.declarations.filter(item => item.status !== "draft").length;
    const locked = data.declarations.filter(item => item.status === "locked").length;
    return <><Header eyebrow="Tổng quan doanh nghiệp" title={`Xin chào, ${data.profile.legalRepresentative || data.profile.ownerName}`} description={`${data.profile.businessName} · MST ${data.profile.taxCode}`}/><div className="grid gap-4 md:grid-cols-3"><Metric label="Bộ tờ khai" value={`${data.declarations.length} hồ sơ`} note="GTGT, TNCN và TNDN" accent="bg-pine"/><Metric label="Đã kiểm tra" value={`${valid} hồ sơ`} note="Đã lưu và qua kiểm tra cơ bản" accent="bg-coral"/><Metric label="Đã khóa" value={`${locked} hồ sơ`} note="Không thể chỉnh sửa" accent="bg-amber-400"/></div><button onClick={() => go("declarations")} className="card group mt-6 w-full text-left"><p className="text-xs font-bold uppercase tracking-wider text-pine">Hồ sơ doanh nghiệp</p><h2 className="mt-3 text-2xl font-semibold text-ink group-hover:text-pine">Lập tờ khai GTGT, TNCN, TNDN →</h2><p className="mt-2 text-sm text-slate-500">Nhập chỉ tiêu, kiểm tra dữ liệu và khóa tờ khai theo kỳ.</p></button></>;
  }
  const calculations = data.periods.map((period) => period.taxSnapshot ?? calculateTax(data.profile, period, data.transactions));
  const revenue = calculations.reduce((sum, item) => sum + item.revenue, 0);
  const expenses = calculations.reduce((sum, item) => sum + item.expenses, 0);
  const tax = calculations.reduce((sum, item) => sum + item.totalTax, 0);
  const nextDue = [...data.periods].filter(period => period.status !== "completed").sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return <><Header eyebrow="Tổng quan năm 2026" title={`Chào buổi sáng, ${data.profile.ownerName.split(" ").at(-1)}!`} description="Bức tranh nhanh về hoạt động kinh doanh và nghĩa vụ thuế hiện tại."/>
    {nextDue && <button onClick={() => go("periods")} className="mb-5 flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left"><span className="text-sm text-amber-900"><strong>Nhắc hạn:</strong> {nextDue.label} cần hoàn tất trước {new Date(nextDue.dueDate).toLocaleDateString("vi-VN")}</span><span className="text-amber-700">→</span></button>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Tổng doanh thu" value={formatVnd(revenue)} note="Từ các kỳ đã ghi nhận" accent="bg-pine"/>
      <Metric label="Lợi nhuận tạm tính" value={formatVnd(revenue - expenses)} note={`${formatVnd(expenses)} chi phí`} accent="bg-blue-500"/>
      <Metric label="Thuế dự kiến" value={formatVnd(tax)} note="GTGT + Thuế thu nhập" accent="bg-coral"/>
      <Metric label="Kỳ chưa hoàn tất" value={`${data.periods.filter((p) => p.status !== "completed").length} kỳ`} note="Cần tiếp tục xử lý" accent="bg-amber-400"/>
    </div>
    <section className="card mt-6"><div className="flex items-center justify-between"><div><h2 className="section-title">Kỳ kê khai gần đây</h2><p className="section-subtitle">Theo dõi tiến độ và hạn nộp</p></div><button className="link-button" onClick={() => go("periods")}>Xem tất cả →</button></div>
      <div className="mt-5 overflow-x-auto"><table><thead><tr><th>Kỳ kê khai</th><th>Doanh thu</th><th>Thuế dự kiến</th><th>Hạn nộp</th><th>Trạng thái</th></tr></thead><tbody>{data.periods.map((period, i) => <tr key={period.id}><td className="font-semibold text-ink">{period.label}</td><td>{formatVnd(calculations[i].revenue)}</td><td>{formatVnd(calculations[i].totalTax)}</td><td>{new Date(period.dueDate).toLocaleDateString("vi-VN")}</td><td><span className={`badge ${statusStyle[period.status]}`}>{periodStatusLabel(period, data.transactions)}</span></td></tr>)}</tbody></table></div>
    </section>
    <div className="mt-6 grid gap-4 md:grid-cols-2"><button onClick={() => go("transactions")} className="card group text-left"><p className="text-xs font-bold uppercase tracking-wider text-coral">Tiếp tục kỳ hiện tại</p><h3 className="mt-3 text-xl font-semibold text-ink group-hover:text-pine">Nhập doanh thu Quý 3/2026 →</h3><p className="mt-2 text-sm text-slate-500">Bổ sung hóa đơn và rà soát giao dịch trước khi tính thuế.</p></button><button onClick={() => go("import")} className="card group text-left"><p className="text-xs font-bold uppercase tracking-wider text-pine">Thao tác nhanh</p><h3 className="mt-3 text-xl font-semibold text-ink group-hover:text-pine">Import dữ liệu từ Excel →</h3><p className="mt-2 text-sm text-slate-500">Tải file mẫu, kiểm tra lỗi và xác nhận nhập dữ liệu.</p></button></div>
  </>;
}

function Metric({ label, value, note, accent }: { label: string; value: string; note: string; accent: string }) {
  return <div className="card relative overflow-hidden"><div className={`absolute left-0 top-0 h-full w-1 ${accent}`}/><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-2xl font-semibold text-ink">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></div>;
}

function Profile({ data, refresh }: { data: TaxDatabase; refresh: () => Promise<void> }) {
  const [form, setForm] = useState<BusinessProfile>(data.profile); const [saved, setSaved] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); await taxApi.updateProfile(form); await refresh(); setSaved(true); }
  const enterprise = form.taxpayerType === "enterprise";
  return <><Header eyebrow="Thiết lập" title={enterprise ? "Hồ sơ doanh nghiệp" : "Hồ sơ hộ kinh doanh"} description="Loại người nộp thuế quyết định bộ tờ khai và engine nghiệp vụ được sử dụng."/><form onSubmit={submit} className="card grid gap-5 md:grid-cols-2">
    <Field label="Đối tượng nộp thuế" wide><select className="field" value={form.taxpayerType} onChange={(e) => setForm({...form, taxpayerType: e.target.value as BusinessProfile["taxpayerType"]})}><option value="household">Hộ kinh doanh</option><option value="enterprise">Doanh nghiệp / công ty</option></select></Field>
    <Field label={enterprise ? "Tên doanh nghiệp" : "Tên hộ kinh doanh"}><input className="field" value={form.businessName} onChange={(e) => setForm({...form, businessName: e.target.value})}/></Field><Field label="Mã số thuế"><input className="field" value={form.taxCode} onChange={(e) => setForm({...form, taxCode: e.target.value})}/></Field>
    <Field label={enterprise ? "Người đại diện pháp luật" : "Chủ hộ kinh doanh"}><input className="field" value={enterprise ? form.legalRepresentative ?? "" : form.ownerName} onChange={(e) => setForm(enterprise ? {...form, legalRepresentative: e.target.value} : {...form, ownerName: e.target.value})}/></Field><Field label="Kỳ kê khai"><select className="field" value={form.declarationKind} onChange={(e) => setForm({...form, declarationKind: e.target.value as "month"|"quarter"})}><option value="quarter">Theo quý</option><option value="month">Theo tháng</option></select></Field>
    {enterprise ? <><Field label="Loại hình doanh nghiệp"><select className="field" value={form.enterpriseType ?? "limited"} onChange={(e) => setForm({...form, enterpriseType: e.target.value as BusinessProfile["enterpriseType"]})}><option value="limited">Công ty TNHH</option><option value="joint_stock">Công ty cổ phần</option><option value="private">Doanh nghiệp tư nhân</option><option value="partnership">Công ty hợp danh</option></select></Field><Field label="Phương pháp GTGT"><select className="field" value={form.vatMethod ?? "deduction"} onChange={(e) => setForm({...form, vatMethod: e.target.value as BusinessProfile["vatMethod"]})}><option value="deduction">Khấu trừ</option><option value="direct">Trực tiếp</option></select></Field><Field label="Chế độ kế toán" wide><select className="field" value={form.accountingRegime ?? "circular_133"} onChange={(e) => setForm({...form, accountingRegime: e.target.value as BusinessProfile["accountingRegime"]})}><option value="circular_133">Thông tư 133</option><option value="circular_200">Thông tư 200</option></select></Field></> : <Field label="Phương pháp tính thuế / nhóm sổ" wide><select className="field" value={form.householdTaxMethod ?? "revenue_percentage"} onChange={(e) => setForm({...form, householdTaxMethod: e.target.value as BusinessProfile["householdTaxMethod"]})}><option value="non_taxable">Không chịu GTGT, không nộp TNCN · S1a-HKD</option><option value="revenue_percentage">Thuế theo tỷ lệ trên doanh thu · S2a-HKD</option><option value="taxable_income">TNCN trên thu nhập tính thuế · S2b–S2e-HKD</option></select></Field>}
    <Field label="Địa chỉ" wide><input className="field" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})}/></Field><Field label="Ngành nghề" wide><select className="field" value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value as BusinessProfile["industry"]})}><option value="distribution">Phân phối, cung cấp hàng hóa</option><option value="services">Dịch vụ</option><option value="production">Sản xuất, vận tải</option><option value="other">Kinh doanh khác</option></select></Field>
    <div className="flex items-center gap-3 md:col-span-2"><button className="primary">Lưu hồ sơ</button>{saved && <span className="text-sm text-pine">Đã lưu thay đổi</span>}</div>
  </form></>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={`text-sm font-medium text-ink ${wide ? "md:col-span-2" : ""}`}><span className="mb-2 block">{label}</span>{children}</label>; }

function Periods({ data, go }: { data: TaxDatabase; go: (view: View) => void }) {
  return <><Header eyebrow="Kê khai" title="Danh sách kỳ kê khai" description="Quản lý tiến độ theo tháng hoặc quý. Kỳ chưa có giao dịch hiển thị Chưa nhập; chỉ Chờ duyệt sau khi bạn chủ động gửi duyệt."/><section className="card overflow-x-auto"><table><thead><tr><th>Kỳ</th><th>Loại</th><th>Hạn nộp</th><th>Đã nộp</th><th>Trạng thái</th><th></th></tr></thead><tbody>{data.periods.map((period) => <tr key={period.id}><td className="font-semibold text-ink">{period.label}{period.lockedAt && <span className="ml-2 text-xs text-slate-400">🔒</span>}</td><td>{period.kind === "quarter" ? "Theo quý" : "Theo tháng"}</td><td>{new Date(period.dueDate).toLocaleDateString("vi-VN")}</td><td>{formatVnd(period.paidAmount)}</td><td><span className={`badge ${statusStyle[period.status]}`}>{periodStatusLabel(period, data.transactions)}</span></td><td><button className="link-button" onClick={() => go("result")}>Xem kết quả</button></td></tr>)}</tbody></table></section></>;
}

function PeriodPicker({ data, activePeriodId, selectPeriod, go }: { data: TaxDatabase; activePeriodId: string; selectPeriod: (periodId: string) => void; go: (view: View) => void }) {
  const periods = [...data.periods].sort((a, b) => a.id.localeCompare(b.id));
  return <section className="card mb-5"><h2 className="section-title">Chọn kỳ muốn nhập dữ liệu</h2><p className="section-subtitle">Kỳ đã chọn được ghi nhớ cho giao dịch, import, tính thuế và xuất Excel.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{periods.map(period => <button key={period.id} disabled={Boolean(period.lockedAt)} onClick={() => { selectPeriod(period.id); go("transactions"); }} className={`rounded-xl border p-4 text-left transition disabled:opacity-50 ${period.id === activePeriodId ? "border-pine bg-mint/60 ring-2 ring-mint" : "hover:border-pine"}`}><div className="flex items-center justify-between"><span className="font-semibold text-ink">{period.label}</span>{period.id === activePeriodId && <span className="badge bg-pine text-white">Đang chọn</span>}</div><p className="mt-2 text-xs text-slate-500">{periodStatusLabel(period, data.transactions)} · Hạn {new Date(period.dueDate).toLocaleDateString("vi-VN")}</p><p className="mt-3 text-sm font-semibold text-pine">{period.lockedAt ? "Kỳ đã khóa" : "Nhập dữ liệu kỳ này →"}</p></button>)}</div></section>;
}

function Transactions({ data, refresh }: { data: TaxDatabase; refresh: () => Promise<void> }) {
  const [amount, setAmount] = useState(""); const [description, setDescription] = useState(""); const [type, setType] = useState<Transaction["type"]>("revenue"); const [category, setCategory] = useState<BusinessProfile["industry"]>(data.profile.industry);
  async function submit(e: FormEvent) { e.preventDefault(); if (!parseVnd(amount) || !description) return; await taxApi.createTransaction({ id: crypto.randomUUID(), periodId: data.periods[0].id, date: new Date().toISOString().slice(0,10), type, description, invoiceNo: `HD-${Date.now().toString().slice(-5)}`, amount: parseVnd(amount), revenueCategory: category, paymentStatus: "paid", outstandingAmount: 0 }); setAmount(""); setDescription(""); await refresh(); }
  const items = data.transactions.filter((item) => item.periodId === data.periods[0].id);
  const issues = validateTransactions(items);
  return <><Header eyebrow="Giao dịch" title="Doanh thu, chi phí & hóa đơn" description={`Đang nhập dữ liệu cho ${data.periods[0].label}. Toàn bộ giá trị tiền được lưu dưới dạng số nguyên VND.`}/>{issues.length > 0 && <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Có {issues.length} cảnh báo thiếu, sai hoặc trùng dữ liệu cần rà soát.</div>}<form onSubmit={submit} className="card mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-[140px_190px_1fr_190px_auto]"><select className="field" value={type} onChange={(e) => setType(e.target.value as Transaction["type"])}><option value="revenue">Doanh thu</option><option value="expense">Chi phí</option></select><select className="field" value={category} onChange={(e) => setCategory(e.target.value as BusinessProfile["industry"])}><option value="distribution">Phân phối</option><option value="services">Dịch vụ</option><option value="production">Sản xuất, vận tải</option><option value="other">Nhóm khác</option></select><input className="field" placeholder="Nội dung giao dịch" value={description} onChange={(e) => setDescription(e.target.value)}/><input className="field" inputMode="numeric" placeholder="Số tiền (VND)" value={amount} onChange={(e) => setAmount(e.target.value)}/><button disabled={Boolean(data.periods[0].lockedAt)} className="primary disabled:opacity-40">Thêm mới</button></form><section className="card overflow-x-auto"><table><thead><tr><th>Ngày</th><th>Loại</th><th>Nhóm ngành</th><th>Nội dung</th><th>Hóa đơn</th><th className="text-right">Số tiền</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className={issues.some(issue => issue.transactionId === item.id) ? "bg-amber-50/50" : ""}><td>{new Date(item.date).toLocaleDateString("vi-VN")}</td><td><span className={`badge ${item.type === "revenue" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.type === "revenue" ? "Doanh thu" : "Chi phí"}</span></td><td>{item.revenueCategory}</td><td className="font-medium text-ink">{item.description}</td><td>{item.invoiceNo}</td><td className="text-right font-semibold">{formatVnd(item.amount)}</td></tr>)}</tbody></table></section></>;
}

function TransactionRemoval({ data, refresh }: { data: TaxDatabase; refresh: () => Promise<void> }) {
  const items = data.transactions.filter(item => item.periodId === data.periods[0].id);
  const [error, setError] = useState("");
  if (!items.length) return null;
  async function remove(item: Transaction) {
    if (!window.confirm(`Xóa giao dịch “${item.description}” (${formatVnd(item.amount)})?`)) return;
    setError("");
    try { await taxApi.deleteTransaction(item.id); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể xóa giao dịch"); }
  }
  if (error) return <section className="card mt-5"><p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p><button onClick={() => setError("")} className="secondary mt-3">Đóng thông báo</button></section>;
  return <section className="card mt-5"><h2 className="section-title">Xóa giao dịch nhập sai</h2><p className="section-subtitle">Chỉ thực hiện được trước khi khóa kỳ; thao tác xóa được lưu trong lịch sử.</p><div className="mt-4 divide-y">{items.map(item => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-medium text-ink">{item.description}</p><p className="mt-1 text-xs text-slate-400">{item.invoiceNo} · {formatVnd(item.amount)}</p></div><button disabled={Boolean(data.periods[0].lockedAt)} onClick={() => void remove(item)} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40">Xóa</button></div>)}</div></section>;
}

type PreviewRow = Transaction & { error?: string };

function ImportExcel({ data, refresh }: { data: TaxDatabase; refresh: () => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null); const [rows, setRows] = useState<PreviewRow[]>([]); const [message, setMessage] = useState("");
  async function downloadTemplate() {
    const ExcelJS = await import("exceljs"); const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet("Giao dich");
    sheet.columns = [{ header: "ngay", key: "ngay", width: 14 }, { header: "loai", key: "loai", width: 16 }, { header: "nhom_nganh", key: "nhom_nganh", width: 18 }, { header: "noi_dung", key: "noi_dung", width: 32 }, { header: "so_hoa_don", key: "so_hoa_don", width: 18 }, { header: "so_chung_tu", key: "so_chung_tu", width: 18 }, { header: "so_tien_vnd", key: "so_tien_vnd", width: 18 }];
    sheet.addRow({ ngay: "2026-08-01", loai: "doanh_thu", nhom_nganh: "distribution", noi_dung: "Ví dụ bán hàng", so_hoa_don: "HD-001", so_chung_tu: "", so_tien_vnd: 1000000 });
    downloadBuffer(await book.xlsx.writeBuffer(), "mau-import-thue.xlsx");
  }
  async function selectFile(file?: File) {
    if (!file) return; const ExcelJS = await import("exceljs"); const book = new ExcelJS.Workbook(); await book.xlsx.load(await file.arrayBuffer()); const sheet = book.worksheets[0]; const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(String); const raw: Record<string, unknown>[] = [];
    sheet.eachRow((row, rowNumber) => { if (rowNumber === 1) return; const values = (row.values as unknown[]).slice(1); raw.push(Object.fromEntries(headers.map((header, index) => [header, values[index]]))); });
    const seenKeys = new Set(data.transactions.map(item => `${item.date}|${item.invoiceNo.trim().toLowerCase()}|${item.amount}`));
    setRows(raw.map((row, index) => { const amount = Number(row.so_tien_vnd); const date = String(row.ngay ?? ""); const category = String(row.nhom_nganh ?? ""); const invoiceNo = String(row.so_hoa_don ?? ""); const key = `${date}|${invoiceNo.trim().toLowerCase()}|${amount}`; const duplicate = seenKeys.has(key); seenKeys.add(key); const error = !/^\d{4}-\d{2}-\d{2}$/.test(date) ? "Ngày phải có dạng YYYY-MM-DD" : !Number.isSafeInteger(amount) || amount <= 0 ? "Số tiền phải là số nguyên dương" : !["doanh_thu", "chi_phi"].includes(String(row.loai)) ? "Loại không hợp lệ" : !["distribution", "services", "production", "other"].includes(category) ? "Nhóm ngành không hợp lệ" : !invoiceNo ? "Thiếu số hóa đơn/chứng từ" : duplicate ? "Trùng giao dịch đã có hoặc trong file" : undefined; return { id: crypto.randomUUID(), periodId: data.periods[0].id, date, type: row.loai === "chi_phi" ? "expense" : "revenue", revenueCategory: category as BusinessProfile["industry"], description: String(row.noi_dung ?? "Dòng " + (index + 2)), invoiceNo, documentNo: String(row.so_chung_tu ?? ""), amount: Number.isFinite(amount) ? amount : 0, paymentStatus: "paid", outstandingAmount: 0, error }; })); setMessage("");
  }
  async function confirm() { const valid = rows.filter((row) => !row.error).map(({ error: _, ...row }) => row); if (!valid.length || valid.length !== rows.length || data.periods[0].lockedAt) return; await taxApi.confirmImport(valid); await refresh(); setMessage(`Đã nhập thành công ${valid.length} giao dịch.`); setRows([]); }
  return <><Header eyebrow="Nhập dữ liệu" title="Import giao dịch từ Excel" description="Dùng đúng file mẫu để kiểm tra dữ liệu trước khi ghi vào kỳ kê khai."/>{data.periods[0].lockedAt && <p className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Kỳ hiện tại đã khóa; chỉ có thể xem và xuất dữ liệu.</p>}<div className="grid gap-5 lg:grid-cols-[1fr_1.7fr]"><section className="card"><span className="grid h-12 w-12 place-items-center rounded-xl bg-mint text-xl font-bold text-pine">1</span><h2 className="mt-5 section-title">Chuẩn bị file dữ liệu</h2><p className="mt-2 text-sm leading-6 text-slate-500">Tải file mẫu gồm ngày, loại giao dịch, nhóm ngành, hóa đơn, chứng từ và số tiền nguyên VND.</p><button onClick={downloadTemplate} className="secondary mt-5">↓ Tải file mẫu Excel</button><div className="my-7 border-t"/><span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-xl font-bold text-coral">2</span><h2 className="mt-5 section-title">Chọn file đã điền</h2><input ref={inputRef} className="hidden" type="file" accept=".xlsx,.xls" onChange={(e) => void selectFile(e.target.files?.[0])}/><button disabled={Boolean(data.periods[0].lockedAt)} onClick={() => inputRef.current?.click()} className="primary mt-5 w-full disabled:opacity-40">Chọn file Excel</button>{message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}</section><section className="card min-w-0"><div className="flex items-center justify-between"><div><h2 className="section-title">Xem trước & kiểm tra</h2><p className="section-subtitle">{rows.length ? `${rows.length} dòng · ${rows.filter(r => r.error).length} lỗi` : "Chưa có dữ liệu"}</p></div>{rows.length > 0 && <button disabled={rows.some(r => r.error) || Boolean(data.periods[0].lockedAt)} onClick={() => void confirm()} className="primary disabled:cursor-not-allowed disabled:opacity-40">Xác nhận import</button>}</div>{rows.length === 0 ? <div className="mt-8 grid min-h-56 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-400">Dữ liệu xem trước sẽ xuất hiện ở đây</div> : <div className="mt-5 overflow-x-auto"><table><thead><tr><th>Dòng</th><th>Ngày</th><th>Nhóm ngành</th><th>Nội dung</th><th>Số tiền</th><th>Kiểm tra</th></tr></thead><tbody>{rows.map((row, i) => <tr key={row.id}><td>{i+2}</td><td>{row.date}</td><td>{row.revenueCategory}</td><td>{row.description}</td><td>{formatVnd(row.amount)}</td><td>{row.error ? <span className="text-xs text-red-600">{row.error}</span> : <span className="text-emerald-600">Hợp lệ</span>}</td></tr>)}</tbody></table></div>}</section></div></>;
}

function ElectronicInvoiceImport() {
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ valid: number; invalid: number } | null>(null);
  async function inspect(files?: FileList | null) {
    if (!files?.length) return;
    const checks = await Promise.all(Array.from(files).map(async file => {
      try { const content = await file.text(); if (file.name.toLowerCase().endsWith(".json")) { JSON.parse(content); return true; } return file.name.toLowerCase().endsWith(".xml") && content.trimStart().startsWith("<"); }
      catch { return false; }
    }));
    setResult({ valid: checks.filter(Boolean).length, invalid: checks.filter(value => !value).length });
  }
  return <section className="card mt-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-pine">Hóa đơn điện tử</p><h2 className="mt-1 section-title">Nhập file XML/JSON</h2><p className="mt-2 text-sm text-slate-500">Kiểm tra định dạng trước khi ánh xạ vào doanh thu, chi phí và công nợ.</p></div><input ref={input} type="file" accept=".xml,.json" multiple className="hidden" onChange={(event) => void inspect(event.target.files)}/><button onClick={() => input.current?.click()} className="secondary">Chọn hóa đơn điện tử</button></div>{result && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><span className="text-emerald-700">{result.valid} file hợp lệ định dạng</span>{result.invalid > 0 && <span className="ml-4 text-red-600">{result.invalid} file lỗi</span>}<p className="mt-2 text-xs text-slate-400">Cần bổ sung mapping theo nhà cung cấp/schema hóa đơn trước khi xác nhận ghi sổ.</p></div>}</section>;
}

function Result({ data, refresh }: { data: TaxDatabase; refresh: () => Promise<void> }) {
  const [periodId, setPeriodId] = useState(data.periods[0].id);
  const period = data.periods.find(p => p.id === periodId)!;
  const localResult = useMemo(() => period.taxSnapshot ?? calculateTax(data.profile, period, data.transactions), [data, period]);
  const [apiResult, setApiResult] = useState<TaxBreakdown | null>(period.taxSnapshot ?? null);
  useEffect(() => {
    let active = true;
    void taxApi.calculate(period.id).then((value) => { if (active) setApiResult(value); }).catch(() => { if (active) setApiResult(null); });
    return () => { active = false; };
  }, [period.id, period.taxSnapshot]);
  const result = apiResult?.periodId === period.id ? apiResult : localResult;
  const issues = validateTransactions(data.transactions.filter(item => item.periodId === period.id));
  async function lock() { if (issues.length) return; await taxApi.lockPeriod(period.id); await refresh(); }
  return <><Header eyebrow="Tính thuế" title="Kết quả & công thức" description="Tính theo từng nhóm ngành; kỳ đã khóa luôn đọc snapshot công thức cũ."/><div className="mb-5 flex justify-end"><select className="field max-w-xs" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>{data.periods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></div><div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><section className="card"><p className="text-xs font-bold uppercase tracking-wider text-pine">Cơ sở tính thuế</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><ResultBox label="Tổng doanh thu" value={formatVnd(result.revenue)}/><ResultBox label="Chi phí ghi nhận" value={formatVnd(result.expenses)}/></div><div className="my-7 border-t"/><h2 className="section-title">Chi tiết theo nhóm ngành</h2>{result.lines.map(line => <div key={line.ruleId}><Formula label={`${line.industry} · GTGT`} formula={`${formatVnd(line.revenue)} × ${line.vatRateBps / 100}%`} result={line.vat}/><Formula label={`${line.industry} · Thuế thu nhập`} formula={`${formatVnd(line.revenue)} × ${line.pitRateBps / 100}%`} result={line.pit}/></div>)}<p className="mt-5 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-800">Cấu hình {result.formulaVersion}. {period.lockedAt ? `Snapshot khóa lúc ${new Date(period.lockedAt).toLocaleString("vi-VN")}.` : "Tỷ lệ minh họa, cần nghiệp vụ xác nhận trước khi dùng thật."}</p></section><section className="rounded-3xl bg-ink p-7 text-white shadow-card"><p className="text-xs uppercase tracking-[.18em] text-white/50">Nghĩa vụ kỳ này</p><p className="mt-3 text-3xl font-semibold">{formatVnd(result.totalTax)}</p><div className="my-7 border-t border-white/10"/><Summary label="Thuế GTGT" value={result.vat}/><Summary label="Thuế thu nhập" value={result.pit}/><Summary label="Đã nộp" value={result.paid}/><div className="my-5 border-t border-white/10"/><div className="flex items-end justify-between"><span className="text-sm text-white/60">Còn phải nộp</span><span className="text-2xl font-semibold text-coral">{formatVnd(result.remaining)}</span></div>{issues.length > 0 && <p className="mt-5 text-xs text-amber-300">Còn {issues.length} cảnh báo; chưa thể khóa kỳ.</p>}<button disabled={Boolean(period.lockedAt) || issues.length > 0} onClick={() => void lock()} className="mt-7 w-full rounded-xl bg-white px-4 py-3 font-semibold text-ink disabled:opacity-40">{period.lockedAt ? "Kỳ đã khóa" : "Khóa kỳ & lưu snapshot"}</button><p className="mt-4 text-center text-xs text-white/40">Không tự động nộp lên Thuế điện tử</p></section></div></>;
}
function ResultBox({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-ink">{value}</p></div>; }
function Formula({ label, formula, result }: { label: string; formula: string; result: number }) { return <div className="mt-4 flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-ink">{label}</p><p className="mt-1 text-xs text-slate-400">{formula}</p></div><p className="font-semibold text-pine">{formatVnd(result)}</p></div>; }
function Summary({ label, value }: { label: string; value: number }) { return <div className="mb-4 flex justify-between text-sm"><span className="text-white/55">{label}</span><span>{formatVnd(value)}</span></div>; }

const declarationFieldLabels: Record<string, string> = {
  outputVat: "Thuế GTGT đầu ra", deductibleInputVat: "Thuế GTGT đầu vào được khấu trừ", payableVat: "Thuế GTGT phải nộp",
  employees: "Số lao động", taxableIncome: "Thu nhập chịu thuế", withheldTax: "Thuế đã khấu trừ",
  revenue: "Tổng doanh thu", deductibleExpenses: "Chi phí được trừ", payableTax: "Thuế TNDN phải nộp"
};

function Declarations({ data, refresh }: { data: TaxDatabase; refresh: () => Promise<void> }) {
  const [selectedId, setSelectedId] = useState(data.declarations[0]?.id ?? "");
  const selected = data.declarations.find(item => item.id === selectedId) ?? data.declarations[0];
  const [draft, setDraft] = useState<TaxDeclaration | undefined>(selected);
  const [message, setMessage] = useState("");
  useEffect(() => { setDraft(selected); setMessage(""); }, [selected]);
  if (!draft) return null;
  const invalid = Object.values(draft.values).some(value => typeof value === "number" && (!Number.isSafeInteger(value) || value < 0));
  async function save(lock = false) { if (!draft || invalid || draft.lockedAt) return; const next = { ...draft, status: lock ? "locked" as const : "valid" as const, updatedAt: new Date().toISOString(), lockedAt: lock ? new Date().toISOString() : undefined }; await taxApi.saveDeclaration(next); await refresh(); setMessage(lock ? "Đã khóa tờ khai." : "Đã lưu và kiểm tra dữ liệu."); }
  return <><Header eyebrow="Doanh nghiệp" title="Lập tờ khai thuế" description="Bộ hồ sơ GTGT, khấu trừ TNCN và quyết toán TNDN được quản lý độc lập với thuế hộ kinh doanh."/>{data.profile.taxpayerType !== "enterprise" && <div className="mb-5 rounded-2xl bg-blue-50 p-4 text-sm text-blue-700">Hãy chuyển “Đối tượng nộp thuế” sang Doanh nghiệp / công ty trong Hồ sơ để sử dụng bộ tờ khai này.</div>}<div className="grid gap-5 lg:grid-cols-[.8fr_1.5fr]"><section className="card space-y-3">{data.declarations.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-4 text-left ${item.id === selectedId ? "border-pine bg-mint/50" : "hover:border-pine"}`}><div className="flex justify-between"><span className="font-semibold text-ink">{item.formCode}</span><span className={`badge ${item.status === "locked" ? "bg-slate-100" : item.status === "valid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.status === "locked" ? "Đã khóa" : item.status === "valid" ? "Hợp lệ" : "Bản nháp"}</span></div><p className="mt-2 text-sm text-slate-500">{item.formName}</p><p className="mt-2 text-xs text-slate-400">{item.periodLabel}</p></button>)}</section><form onSubmit={(e) => { e.preventDefault(); void save(); }} className="card"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-pine">{draft.schemaVersion}</p><h2 className="mt-1 text-xl font-semibold text-ink">{draft.formCode} · {draft.periodLabel}</h2></div><span className="badge bg-slate-100 text-slate-600">{draft.periodType === "year" ? "Năm" : draft.periodType === "quarter" ? "Quý" : "Tháng"}</span></div><div className="mt-7 grid gap-5 md:grid-cols-2">{Object.entries(draft.values).map(([key, value]) => <Field key={key} label={declarationFieldLabels[key] ?? key}><input disabled={Boolean(draft.lockedAt)} className="field disabled:bg-slate-50" inputMode="numeric" value={String(value)} onChange={(e) => setDraft({...draft, values: {...draft.values, [key]: parseVnd(e.target.value)}})}/></Field>)}</div>{invalid && <p className="mt-5 text-sm text-red-600">Chỉ tiêu tiền phải là số nguyên VND không âm.</p>}{message && <p className="mt-5 text-sm text-pine">{message}</p>}<div className="mt-7 flex flex-wrap gap-3"><button disabled={Boolean(draft.lockedAt)} className="primary disabled:opacity-40">Lưu & kiểm tra</button><button type="button" disabled={Boolean(draft.lockedAt) || invalid} onClick={() => void save(true)} className="secondary disabled:opacity-40">Khóa tờ khai</button><button type="button" disabled className="secondary opacity-40" title="Chờ schema chính thức">Kết xuất XML</button></div><p className="mt-5 text-xs leading-5 text-slate-400">Chưa tạo XML/mã vạch. Các chức năng này chỉ được bật sau khi schema và quy tắc kiểm tra được xác nhận bằng HTKK/iTaxViewer.</p></form></div></>;
}

const accountingBooks = {
  non_taxable: [{ code: "S1a-HKD", name: "Sổ doanh thu bán hàng hóa, dịch vụ" }],
  revenue_percentage: [{ code: "S2a-HKD", name: "Sổ doanh thu theo nhóm ngành tính thuế" }],
  taxable_income: [
    { code: "S2b-HKD", name: "Sổ doanh thu bán hàng hóa, dịch vụ" },
    { code: "S2c-HKD", name: "Sổ chi tiết doanh thu, chi phí" },
    { code: "S2d-HKD", name: "Sổ vật liệu, dụng cụ, sản phẩm, hàng hóa" },
    { code: "S2e-HKD", name: "Sổ chi tiết tiền" }
  ]
} as const;

function Books({ data, go }: { data: TaxDatabase; go: (view: View) => void }) {
  const method = data.profile.householdTaxMethod ?? "revenue_percentage";
  const available = accountingBooks[method];
  const [selectedCode, setSelectedCode] = useState<string>(available[0].code);
  const selected = available.find(item => item.code === selectedCode) ?? available[0];
  const sorted = [...data.transactions].sort((a, b) => a.date.localeCompare(b.date));
  const revenue = sorted.filter(item => item.type === "revenue").reduce((sum, item) => sum + item.amount, 0);
  const expenses = sorted.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const receivables = sorted.reduce((sum, item) => sum + (item.outstandingAmount ?? 0), 0);
  let cashBalance = 0;
  return <><Header eyebrow="Kế toán đơn giản" title="Sổ sách, tiền & công nợ" description="Sổ được chọn theo phương pháp thuế trong Hồ sơ, dữ liệu tự tổng hợp từ giao dịch và chứng từ."/><div className="grid gap-4 md:grid-cols-3"><Metric label="Dòng tiền thuần" value={formatVnd(revenue - expenses)} note={`${formatVnd(revenue)} thu · ${formatVnd(expenses)} chi`} accent="bg-pine"/><Metric label="Công nợ phải thu" value={formatVnd(receivables)} note={`${sorted.filter(item => (item.outstandingAmount ?? 0) > 0).length} hóa đơn chưa thu đủ`} accent="bg-coral"/><Metric label="Tồn kho" value="Chưa có dữ liệu" note="Nhập hàng hóa từ Excel hoặc hóa đơn" accent="bg-amber-400"/></div><div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]"><section className="card h-fit"><p className="text-xs font-bold uppercase tracking-wider text-pine">Thông tư 152/2025/TT-BTC</p><div className="mt-4 space-y-2">{available.map(book => <button key={book.code} onClick={() => setSelectedCode(book.code)} className={`w-full rounded-xl border p-3 text-left ${selected.code === book.code ? "border-pine bg-mint/60" : "hover:border-pine"}`}><p className="font-semibold text-ink">{book.code}</p><p className="mt-1 text-xs leading-5 text-slate-500">{book.name}</p></button>)}</div><button onClick={() => go("profile")} className="link-button mt-5">Đổi phương pháp thuế →</button></section><section className="card min-w-0"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="section-title">{selected.code}</h2><p className="section-subtitle">{selected.name}</p></div><button onClick={() => go("history")} className="secondary">Xuất Excel</button></div>{selected.code === "S2d-HKD" ? <div className="mt-6 grid min-h-56 place-items-center rounded-2xl border border-dashed bg-slate-50 p-6 text-center"><div><p className="font-semibold text-ink">Chưa có dữ liệu tồn kho</p><p className="mt-2 text-sm text-slate-500">Bổ sung mã hàng, số lượng và đơn giá qua file nhập liệu.</p><button onClick={() => go("import")} className="primary mt-4">Nhập dữ liệu</button></div></div> : <div className="mt-5 overflow-x-auto"><table><thead><tr><th>Ngày</th><th>Chứng từ</th><th>Nội dung</th>{selected.code !== "S2e-HKD" && <th>Nhóm ngành</th>}<th className="text-right">Thu</th><th className="text-right">Chi</th>{selected.code === "S2e-HKD" && <th className="text-right">Tồn tiền</th>}</tr></thead><tbody>{sorted.filter(item => selected.code === "S2c-HKD" || selected.code === "S2e-HKD" ? true : item.type === "revenue").map(item => { cashBalance += item.type === "revenue" ? item.amount : -item.amount; return <tr key={item.id}><td>{new Date(item.date).toLocaleDateString("vi-VN")}</td><td>{item.documentNo || item.invoiceNo}</td><td className="font-medium text-ink">{item.description}</td>{selected.code !== "S2e-HKD" && <td>{item.revenueCategory}</td>}<td className="text-right text-emerald-700">{item.type === "revenue" ? formatVnd(item.amount) : "—"}</td><td className="text-right text-coral">{item.type === "expense" ? formatVnd(item.amount) : "—"}</td>{selected.code === "S2e-HKD" && <td className="text-right font-semibold">{formatVnd(cashBalance)}</td>}</tr>})}</tbody></table></div>}</section></div></>;
}

function UserGuide({ go }: { go: (view: View) => void }) {
  const steps: { title: string; text: string; view: View; action: string }[] = [
    { title: "1. Kiểm tra hồ sơ", text: "Chọn hộ kinh doanh/doanh nghiệp, ngành nghề, phương pháp thuế và kỳ khai tháng hoặc quý.", view: "profile", action: "Mở Hồ sơ" },
    { title: "2. Chọn kỳ kê khai", text: "Mỗi kỳ bắt đầu ở trạng thái Chưa nhập. Kiểm tra hạn nộp trước khi ghi dữ liệu.", view: "periods", action: "Xem các kỳ" },
    { title: "3. Nhập giao dịch", text: "Nhập doanh thu, chi phí, hóa đơn/chứng từ thủ công hoặc import Excel. Sửa lỗi và xóa dòng nhập sai trước khi khóa.", view: "transactions", action: "Nhập giao dịch" },
    { title: "4. Kiểm tra thuế", text: "Đối chiếu doanh thu theo nhóm ngành, GTGT, thuế thu nhập, số đã nộp và còn phải nộp.", view: "result", action: "Xem kết quả" },
    { title: "5. Khóa kỳ và xuất sổ", text: "Chỉ khóa sau khi hết cảnh báo. Sau khi khóa không thể sửa; xuất Excel và sổ kế toán để lưu trữ.", view: "history", action: "Xuất dữ liệu" }
  ];
  return <><Header eyebrow="Trợ giúp" title="Sổ tay sử dụng nhanh" description="Hoàn tất một kỳ kê khai theo 5 bước, từ hồ sơ đến khóa kỳ và xuất sổ."/><div className="grid gap-4 md:grid-cols-2">{steps.map(step => <section key={step.title} className="card"><h2 className="section-title">{step.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p><button onClick={() => go(step.view)} className="link-button mt-4">{step.action} →</button></section>)}</div><section className="card mt-5"><h2 className="section-title">Ý nghĩa trạng thái kỳ</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatusHelp label="Chưa nhập" text="Kỳ chưa có giao dịch" color="bg-amber-50 text-amber-700"/><StatusHelp label="Đang nhập" text="Đã có dữ liệu, chưa hoàn tất" color="bg-amber-50 text-amber-700"/><StatusHelp label="Chờ duyệt" text="Chỉ khi bạn chủ động gửi duyệt" color="bg-blue-50 text-blue-700"/><StatusHelp label="Đã khóa" text="Đã lưu snapshot, không được sửa" color="bg-emerald-50 text-emerald-700"/></div></section></>;
}

function StatusHelp({ label, text, color }: { label: string; text: string; color: string }) { return <div className="rounded-xl border p-4"><span className={`badge ${color}`}>{label}</span><p className="mt-2 text-xs text-slate-500">{text}</p></div>; }

function History({ data }: { data: TaxDatabase }) {
  async function exportExcel() {
    const ExcelJS = await import("exceljs"); const period = data.periods[0]; const [items, calculated] = await Promise.all([taxApi.exportData(period.id), taxApi.calculate(period.id)]); const result = period.taxSnapshot ?? calculated; const book = new ExcelJS.Workbook();
    const summary = book.addWorksheet("Tong hop thue"); summary.addRows([["Kỳ", period.label], ["Phiên bản công thức", result.formulaVersion], ["Doanh thu", result.revenue], ["Thuế GTGT", result.vat], ["Thuế thu nhập", result.pit], ["Đã nộp", result.paid], ["Còn phải nộp", result.remaining]]);
    addTransactionSheet(book.addWorksheet("Chi tiet doanh thu"), items.filter(i => i.type === "revenue"));
    addTransactionSheet(book.addWorksheet("Chi phi"), items.filter(i => i.type === "expense"));
    const debt = book.addWorksheet("Cong no"); debt.columns = [{ header: "Số hóa đơn", key: "invoiceNo", width: 18 }, { header: "Khách hàng/Nội dung", key: "description", width: 32 }, { header: "Tổng tiền", key: "amount", width: 18 }, { header: "Còn phải thu", key: "outstandingAmount", width: 18 }]; items.filter(i => (i.outstandingAmount ?? 0) > 0).forEach(i => debt.addRow(i));
    addAccountingBookSheets(book, data.profile.householdTaxMethod ?? "revenue_percentage", items);
    downloadBuffer(await book.xlsx.writeBuffer(), `bao-cao-${period.id}.xlsx`);
  }
  return <><Header eyebrow="Đối soát" title="Lịch sử & xuất dữ liệu" description="Xuất dữ liệu phục vụ kê khai để kiểm tra thủ công; ứng dụng không gửi lên Thuế điện tử."/><div className="grid gap-5 lg:grid-cols-[1fr_2fr]"><section className="card h-fit"><h2 className="section-title">Bộ báo cáo Excel</h2><p className="mt-2 text-sm leading-6 text-slate-500">Gồm tổng hợp thuế, doanh thu, chi phí, công nợ và đúng nhóm sổ Thông tư 152 đã chọn trong Hồ sơ.</p><button onClick={() => void exportExcel()} className="primary mt-6 w-full">Xuất bộ báo cáo</button></section><section className="card"><h2 className="section-title">Lịch sử chỉnh sửa</h2><div className="mt-6 space-y-6">{data.audit.map((entry) => <div key={entry.id} className="relative border-l-2 border-mint pl-6 before:absolute before:-left-[7px] before:top-0 before:h-3 before:w-3 before:rounded-full before:bg-pine"><p className="font-semibold text-ink">{entry.action}</p><p className="mt-1 text-sm text-slate-500">{entry.detail}</p><p className="mt-2 text-xs text-slate-400">{new Date(entry.at).toLocaleString("vi-VN")}</p></div>)}</div></section></div></>;
}

function addTransactionSheet(sheet: import("exceljs").Worksheet, items: Transaction[]) {
  sheet.columns = [{ header: "Ngày", key: "date", width: 14 }, { header: "Nhóm ngành", key: "revenueCategory", width: 18 }, { header: "Nội dung", key: "description", width: 32 }, { header: "Số hóa đơn", key: "invoiceNo", width: 18 }, { header: "Số chứng từ", key: "documentNo", width: 18 }, { header: "Số tiền VND", key: "amount", width: 18 }];
  items.forEach(item => sheet.addRow(item));
}

function addAccountingBookSheets(book: import("exceljs").Workbook, method: NonNullable<BusinessProfile["householdTaxMethod"]>, items: Transaction[]) {
  for (const definition of accountingBooks[method]) {
    const sheet = book.addWorksheet(definition.code);
    sheet.addRow([`${definition.name.toUpperCase()} (${definition.code})`]); sheet.mergeCells("A1:G1");
    if (definition.code === "S2d-HKD") {
      sheet.addRow(["Ngày", "Chứng từ", "Tên hàng hóa", "Đơn vị", "Nhập", "Xuất", "Tồn"]);
      continue;
    }
    sheet.addRow(["Ngày", "Hóa đơn/chứng từ", "Nội dung", "Nhóm ngành", "Thu", "Chi", "Ghi chú"]);
    const rows = definition.code === "S2c-HKD" || definition.code === "S2e-HKD" ? items : items.filter(item => item.type === "revenue");
    rows.forEach(item => sheet.addRow([item.date, item.documentNo || item.invoiceNo, item.description, item.revenueCategory, item.type === "revenue" ? item.amount : 0, item.type === "expense" ? item.amount : 0, ""]));
  }
}

export function ViewContent({ view, data, activePeriodId, selectPeriod, refresh, go }: { view: View; data: TaxDatabase; activePeriodId: string; selectPeriod: (periodId: string) => void; refresh: () => Promise<void>; go: (view: View) => void }) {
  if (view === "profile") return <Profile data={data} refresh={refresh}/>;
  if (view === "periods") return <><PeriodPicker data={data} activePeriodId={activePeriodId} selectPeriod={selectPeriod} go={go}/><Periods data={data} go={go}/></>;
  if (view === "transactions") return <><Transactions data={data} refresh={refresh}/><TransactionRemoval data={data} refresh={refresh}/></>;
  if (view === "books") return <Books data={data} go={go}/>;
  if (view === "import") return <><ImportExcel data={data} refresh={refresh}/><ElectronicInvoiceImport/></>;
  if (view === "result") return data.profile.taxpayerType === "enterprise" ? <Declarations data={data} refresh={refresh}/> : <Result data={data} refresh={refresh}/>;
  if (view === "declarations") return <Declarations data={data} refresh={refresh}/>;
  if (view === "history") return <History data={data}/>;
  if (view === "guide") return <UserGuide go={go}/>;
  return <Dashboard data={data} go={go}/>;
}

function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
