"use client";

import { Icon } from "./icons";

export type View = "dashboard" | "profile" | "periods" | "transactions" | "books" | "import" | "result" | "declarations" | "history" | "guide";

const nav: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Tổng quan", icon: "dashboard" },
  { id: "profile", label: "Hồ sơ kinh doanh", icon: "profile" },
  { id: "periods", label: "Kỳ kê khai", icon: "periods" },
  { id: "transactions", label: "Thu chi & hóa đơn", icon: "transactions" },
  { id: "books", label: "Sổ sách & công nợ", icon: "books" },
  { id: "import", label: "Import Excel", icon: "import" },
  { id: "result", label: "Kết quả tính thuế", icon: "result" },
  { id: "declarations", label: "Tờ khai doanh nghiệp", icon: "declarations" },
  { id: "history", label: "Lịch sử & xuất file", icon: "history" },
  { id: "guide", label: "Sổ tay hướng dẫn", icon: "guide" }
];

export function Sidebar({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  return <aside className="flex w-full shrink-0 flex-col bg-ink px-4 py-5 text-white lg:min-h-screen lg:w-64 lg:px-5 lg:py-8">
    <div className="mb-5 flex items-center gap-3 px-2 lg:mb-10">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-mint font-black text-pine">T</div>
      <div><p className="font-semibold tracking-wide">Thuế Nhẹ Nhàng</p><p className="text-xs text-white/50">Hộ kinh doanh</p></div>
    </div>
    <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
      {nav.map((item) => <button key={item.id} onClick={() => onChange(item.id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${view === item.id ? "bg-white text-ink shadow-lg" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
        <Icon name={item.icon} className="h-5 w-5"/><span>{item.label}</span>
      </button>)}
    </nav>
    <div className="mt-auto hidden rounded-2xl bg-white/5 p-4 lg:block"><p className="text-xs text-white/45">Kỳ đang làm</p><p className="mt-1 font-semibold">Chọn tại Kỳ kê khai</p><p className="mt-2 text-xs leading-5 text-white/45">Giao dịch, tính thuế và xuất sổ sẽ dùng kỳ bạn chọn.</p></div>
  </aside>;
}
