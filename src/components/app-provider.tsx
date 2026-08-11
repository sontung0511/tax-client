"use client";

import type { TaxDatabase } from "@/domain/tax";
import { taxRepository, usingLocalMock } from "@/repositories";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AppContextValue {
  data: TaxDatabase | null;
  loading: boolean;
  error: string;
  activePeriodId: string;
  selectPeriod: (periodId: string) => void;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<TaxDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePeriodId, setActivePeriodId] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await taxRepository.getDatabase()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setActivePeriodId(window.localStorage.getItem("tax-client.active-period.v1") ?? "");
    if (usingLocalMock || window.localStorage.getItem("tax-client.auth.v1")) void refresh();
    else setLoading(false);
  }, [refresh]);
  const selectPeriod = useCallback((periodId: string) => { setActivePeriodId(periodId); window.localStorage.setItem("tax-client.active-period.v1", periodId); }, []);
  useEffect(() => { if (data && !data.periods.some(period => period.id === activePeriodId)) selectPeriod(data.periods[0]?.id ?? ""); }, [activePeriodId, data, selectPeriod]);
  const orderedData = useMemo(() => {
    if (!data || !activePeriodId) return data;
    const selected = data.periods.find(period => period.id === activePeriodId);
    return selected ? { ...data, periods: [selected, ...data.periods.filter(period => period.id !== activePeriodId)] } : data;
  }, [activePeriodId, data]);
  const value = useMemo(() => ({ data: orderedData, loading, error, activePeriodId, selectPeriod, refresh }), [orderedData, loading, error, activePeriodId, selectPeriod, refresh]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useTaxData() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useTaxData must be used inside AppProvider");
  return value;
}
