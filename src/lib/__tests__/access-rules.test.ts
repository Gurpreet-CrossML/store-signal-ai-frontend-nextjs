import { describe, it, expect } from "vitest";

import {
  buildAccess,
  resolveStoreScope,
  resolveTenant,
  requiredLevel,
  isValidSchemaName,
  type RequestAccess,
} from "@/lib/access-rules";

// F5 — the heart of cross-tenant + per-store isolation, tested as pure logic.

describe("resolveTenant — a user is always bound to their own company_code", () => {
  it("returns the user's company_code (there is no client-supplied selector)", () => {
    expect(resolveTenant({ company_code: "crossml" })).toBe("crossml");
    expect(resolveTenant({ is_staff: true, company_code: "myntra" })).toBe(
      "myntra",
    );
  });

  it("returns null for a user without a company_code (→ 403 at the route)", () => {
    expect(resolveTenant({})).toBe(null);
    expect(resolveTenant({ company_code: null })).toBe(null);
  });
});

describe("buildAccess — role → store scope", () => {
  it("treats a company admin (is_staff) as unrestricted", () => {
    const a = buildAccess({
      is_staff: true,
      accessible_stores: [{ code: "a", level: "manage" }],
    });
    expect(a.storeCodes).toBeNull();
    expect(a.isStaff).toBe(true);
  });

  it("limits staff to their granted store codes + levels", () => {
    const a = buildAccess({
      is_staff: false,
      accessible_stores: [
        { code: "x", level: "view" },
        { code: "y", level: "manage" },
      ],
    });
    expect(a.storeCodes).toEqual(["x", "y"]);
    expect(a.levels).toEqual({ x: "view", y: "manage" });
  });

  it("gives a staff user with no grants an empty set (sees nothing)", () => {
    expect(buildAccess({ is_staff: false }).storeCodes).toEqual([]);
  });
});

describe("resolveStoreScope — store_code is validated, never trusted", () => {
  const admin: RequestAccess = {
    isStaff: true,
    storeCodes: null,
    levels: {},
  };
  const staff: RequestAccess = {
    isStaff: false,
    storeCodes: ["x"],
    levels: { x: "view" },
  };

  it("admin: unrestricted (null) without a code, that one store with a code", () => {
    expect(resolveStoreScope(admin)).toBeNull();
    expect(resolveStoreScope(admin, "anything")).toEqual(["anything"]);
  });

  it("staff: granted code allowed; ungranted/forged code denied (empty)", () => {
    expect(resolveStoreScope(staff, "x")).toEqual(["x"]);
    expect(resolveStoreScope(staff, "y")).toEqual([]); // forged → denied
    expect(resolveStoreScope(staff)).toEqual(["x"]); // no code → their set
  });

  it("staff with no grants → empty for any request", () => {
    const none: RequestAccess = { ...staff, storeCodes: [], levels: {} };
    expect(resolveStoreScope(none, "x")).toEqual([]);
    expect(resolveStoreScope(none)).toEqual([]);
  });
});

describe("requiredLevel — method → level", () => {
  it("reads need view, writes need manage", () => {
    expect(requiredLevel("GET")).toBe("view");
    expect(requiredLevel()).toBe("view");
    expect(requiredLevel("POST")).toBe("manage");
    expect(requiredLevel("patch")).toBe("manage");
    expect(requiredLevel("DELETE")).toBe("manage");
  });
});

describe("isValidSchemaName — SET LOCAL identifier safety", () => {
  it("accepts valid Postgres schema identifiers", () => {
    expect(isValidSchemaName("crossml")).toBe(true);
    expect(isValidSchemaName("myntra")).toBe(true);
    expect(isValidSchemaName("acme_retail2")).toBe(true);
  });

  it("rejects injection attempts and invalid identifiers", () => {
    expect(isValidSchemaName('public"; DROP SCHEMA crossml CASCADE; --')).toBe(
      false,
    );
    expect(isValidSchemaName("crossml, public")).toBe(false);
    expect(isValidSchemaName("Crossml")).toBe(false); // uppercase
    expect(isValidSchemaName("1abc")).toBe(false); // leading digit
    expect(isValidSchemaName("a b")).toBe(false); // space
    expect(isValidSchemaName("")).toBe(false);
  });
});
