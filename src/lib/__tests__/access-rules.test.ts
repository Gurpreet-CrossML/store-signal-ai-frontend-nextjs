import { describe, it, expect } from "vitest";

import {
  buildAccess,
  resolveStoreScope,
  resolveTenant,
  can,
  isWriteMethod,
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
      accessible_stores: [{ code: "a" }],
    });
    expect(a.storeCodes).toBeNull();
    expect(a.isStaff).toBe(true);
  });

  it("limits staff to the listed store codes", () => {
    const a = buildAccess({
      is_staff: false,
      accessible_stores: [{ code: "x" }, { code: "y" }],
    });
    expect(a.storeCodes).toEqual(["x", "y"]);
  });

  it("gives a staff user with no stores an empty set (sees nothing)", () => {
    expect(buildAccess({ is_staff: false }).storeCodes).toEqual([]);
  });
});

describe("resolveStoreScope — store_code is validated, never trusted", () => {
  const admin: RequestAccess = {
    isStaff: true,
    storeCodes: null,
  };
  const staff: RequestAccess = {
    isStaff: false,
    storeCodes: ["x"],
  };

  it("admin: unrestricted (null) without a code, that one store with a code", () => {
    expect(resolveStoreScope(admin)).toBeNull();
    expect(resolveStoreScope(admin, "anything")).toEqual(["anything"]);
  });

  it("staff: listed code allowed; unlisted/forged code denied (empty)", () => {
    expect(resolveStoreScope(staff, "x")).toEqual(["x"]);
    expect(resolveStoreScope(staff, "y")).toEqual([]); // forged → denied
    expect(resolveStoreScope(staff)).toEqual(["x"]); // no code → their set
  });

  it("staff with no stores → empty for any request", () => {
    const none: RequestAccess = { ...staff, storeCodes: [] };
    expect(resolveStoreScope(none, "x")).toEqual([]);
    expect(resolveStoreScope(none)).toEqual([]);
  });
});

describe("can — role permissions from Django", () => {
  const viewer = {
    is_staff: false,
    permissions: { conversations: "read", knowledge: "read" } as const,
  };
  const agent = {
    is_staff: false,
    permissions: { conversations: "write", copilot: "write" } as const,
  };

  it("company admin may do everything, including admin-only screens", () => {
    expect(can({ is_staff: true }, undefined, { write: true })).toBe(true);
    expect(can({ is_staff: true }, "knowledge", { write: true })).toBe(true);
  });

  it("staff never reach admin-only (undefined) permissions", () => {
    expect(can(agent, undefined)).toBe(false);
  });

  it("read permission allows reads but not writes", () => {
    expect(can(viewer, "conversations")).toBe(true);
    expect(can(viewer, "conversations", { write: true })).toBe(false);
  });

  it("a permission the role lacks is denied", () => {
    expect(can(agent, "knowledge")).toBe(false);
    expect(can(viewer, "copilot")).toBe(false);
  });

  it("no session → denied", () => {
    expect(can(null, "open")).toBe(false);
  });
});

describe("isWriteMethod", () => {
  it("only GET/HEAD/OPTIONS are reads", () => {
    expect(isWriteMethod("GET")).toBe(false);
    expect(isWriteMethod()).toBe(false);
    expect(isWriteMethod("head")).toBe(false);
    expect(isWriteMethod("POST")).toBe(true);
    expect(isWriteMethod("delete")).toBe(true);
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
