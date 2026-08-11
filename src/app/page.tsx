"use client";

import { AppProvider, useTaxData } from "@/components/app-provider";
import { ViewContent } from "@/components/dashboard-views";
import { Login } from "@/components/login";
import { Sidebar, type View } from "@/components/sidebar";
import { taxDataSourceLabel, usingLocalMock } from "@/repositories";
import { useEffect, useState } from "react";

function Application() {
  const [authenticated, setAuthenticated] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const { data, loading, error, activePeriodId, selectPeriod, refresh } = useTaxData();
  useEffect(() => { setAuthenticated(Boolean(window.localStorage.getItem("tax-client.auth.v1"))); }, []);
  if (!authenticated) return <Login onSuccess={() => { setAuthenticated(true); void refresh(); }}/>;
  if (error) return <div className="grid min-h-screen place-items-center bg-sand p-6"><div className="card max-w-md text-center"><h1 className="text-xl font-semibold text-ink">Không kết nối được API</h1><p className="mt-3 text-sm text-slate-500">{error}</p><button onClick={() => void refresh()} className="primary mt-6">Thử lại</button></div></div>;
  if (loading || !data) return <div className="grid min-h-screen place-items-center bg-sand text-pine">Đang tải dữ liệu…</div>;
  return <div className="min-h-screen bg-sand lg:flex"><Sidebar view={view} onChange={setView}/><main className="min-w-0 flex-1 px-5 py-8 md:px-10 lg:px-14 lg:py-11"><div className="mx-auto max-w-6xl"><div className="mb-8 flex items-center justify-end gap-3"><span className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${usingLocalMock ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{taxDataSourceLabel}</span><div className="text-right"><p className="text-sm font-semibold text-ink">{data.profile.ownerName}</p><p className="text-xs text-slate-400">{data.profile.taxCode}</p></div><div className="grid h-10 w-10 place-items-center rounded-full bg-mint font-bold text-pine">{data.profile.ownerName.charAt(0)}</div></div><ViewContent view={view} data={data} activePeriodId={activePeriodId} selectPeriod={selectPeriod} refresh={refresh} go={setView}/></div></main></div>;
}

export default function Page() { return <AppProvider><Application/></AppProvider>; }
