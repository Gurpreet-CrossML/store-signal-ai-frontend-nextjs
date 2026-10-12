import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_DASHBOARD_FILTERS,
  dashboardFiltersKey,
  loadDashboardFilters,
  resolveDashboardRange,
  saveDashboardFilters,
} from "@/components/custom/dashboard-filters";

// DB-08 — the dashboard's filters are remembered per user and still apply
// the next day.

const KEY = dashboardFiltersKey({
  email: "sup@shop.test",
  company_code: "acme",
});

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("remembered filters", () => {
  it("re-applies the user's last filters, with a preset resolved against the new today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 12, 10));
    saveDashboardFilters(KEY, {
      ...DEFAULT_DASHBOARD_FILTERS,
      range: "7d",
      channel: "whatsapp",
    });

    vi.setSystemTime(new Date(2026, 9, 13, 9));
    const filters = loadDashboardFilters(KEY);

    expect(filters).toMatchObject({ range: "7d", channel: "whatsapp" });
    expect(resolveDashboardRange(filters)).toEqual({
      from: "2026-10-06",
      to: "2026-10-13",
    });
  });

  it("keeps a custom range's own dates", () => {
    const custom = {
      range: "custom" as const,
      from: "2026-09-01",
      to: "2026-09-15",
      channel: "" as const,
    };
    saveDashboardFilters(KEY, custom);

    expect(resolveDashboardRange(loadDashboardFilters(KEY))).toEqual({
      from: "2026-09-01",
      to: "2026-09-15",
    });
  });

  it("is kept per user", () => {
    saveDashboardFilters(KEY, { ...DEFAULT_DASHBOARD_FILTERS, range: "today" });
    const otherUser = dashboardFiltersKey({
      email: "sup@shop.test",
      company_code: "other",
    });

    expect(loadDashboardFilters(otherUser)).toEqual(DEFAULT_DASHBOARD_FILTERS);
  });

  it("falls back to the defaults for missing, corrupt or invalid values", () => {
    expect(loadDashboardFilters(null)).toEqual(DEFAULT_DASHBOARD_FILTERS);
    expect(loadDashboardFilters(KEY)).toEqual(DEFAULT_DASHBOARD_FILTERS);

    localStorage.setItem(KEY!, "{not json");
    expect(loadDashboardFilters(KEY)).toEqual(DEFAULT_DASHBOARD_FILTERS);

    localStorage.setItem(KEY!, JSON.stringify({ range: "7d", channel: "sms" }));
    expect(loadDashboardFilters(KEY)).toEqual(DEFAULT_DASHBOARD_FILTERS);

    localStorage.setItem(
      KEY!,
      JSON.stringify({ range: "custom", channel: "" }),
    );
    expect(loadDashboardFilters(KEY)).toEqual(DEFAULT_DASHBOARD_FILTERS);
  });
});
