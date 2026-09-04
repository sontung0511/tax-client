import type { TaxRepository } from "./tax-repository";
import { HttpTaxRepository } from "./http-tax-repository";
import { localTaxRepository } from "./local-tax-repository";

export const usingLocalMock = process.env.NEXT_PUBLIC_USE_LOCAL_MOCK === "false";
export const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
export const taxDataSourceLabel = usingLocalMock ? "Local mock" : `API · ${apiUrl}`;

export const taxRepository: TaxRepository = usingLocalMock ? localTaxRepository : new HttpTaxRepository(apiUrl);
