"use client";

import { taxApi } from "@/services/tax-api";
import { FormEvent, useState } from "react";

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    try { await taxApi.login({ username, password }); onSuccess(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Đăng nhập thất bại"); }
  }

  return <main className="grid min-h-screen bg-sand lg:grid-cols-2">
    <section className="hidden overflow-hidden bg-ink p-14 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-xl font-black text-pine">T</div><span className="text-lg font-semibold">Thuế Nhẹ Nhàng</span></div>
      <div><p className="mb-5 text-sm uppercase tracking-[.25em] text-mint/60">Rõ từng con số</p><h1 className="max-w-xl text-6xl font-semibold leading-[1.08]">Kê khai thuế<br/>đơn giản hơn<br/><span className="text-coral">mỗi kỳ.</span></h1><p className="mt-7 max-w-md text-white/55">Theo dõi doanh thu, hóa đơn và số thuế dự kiến của hộ kinh doanh trên một luồng thống nhất.</p></div>
      <p className="text-xs text-white/30">Dữ liệu demo được lưu cục bộ trên trình duyệt này.</p>
    </section>
    <section className="flex items-center justify-center p-6"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card md:p-11">
      <p className="text-sm font-semibold text-pine">CHÀO MỪNG TRỞ LẠI</p><h2 className="mt-2 text-3xl font-semibold text-ink">Đăng nhập tài khoản</h2><p className="mt-2 text-sm text-slate-500">Dùng tài khoản chung để truy cập bản thử nghiệm.</p>
      <label className="mt-8 block text-sm font-medium">Tên đăng nhập<input value={username} onChange={(e) => setUsername(e.target.value)} className="field mt-2"/></label>
      <label className="mt-5 block text-sm font-medium">Mật khẩu<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field mt-2"/></label>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button className="mt-7 w-full rounded-xl bg-pine px-5 py-3.5 font-semibold text-white hover:bg-ink">Đăng nhập</button><p className="mt-5 text-center text-xs text-slate-400">Tài khoản: demo · Mật khẩu: demo123</p>
    </form></section>
  </main>;
}
