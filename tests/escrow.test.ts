import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const merchant = accounts.get("wallet_1")!;
const other = accounts.get("wallet_2")!;

const USDC_CONTRACT = `${deployer}.usdc-token`;

describe("escrow: create-campaign", () => {
  it("creates a campaign and returns campaign id 1", () => {
    const { result } = simnet.callPublicFn(
      "escrow",
      "create-campaign",
      [Cl.uint(500), Cl.uint(1000000), Cl.principal(USDC_CONTRACT)],
      merchant
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("increments campaign id on second creation", () => {
    simnet.callPublicFn("escrow", "create-campaign", [Cl.uint(500), Cl.uint(1000000), Cl.principal(USDC_CONTRACT)], merchant);
    const { result } = simnet.callPublicFn("escrow", "create-campaign", [Cl.uint(300), Cl.uint(2000000), Cl.principal(USDC_CONTRACT)], merchant);
    expect(result).toBeOk(Cl.uint(2));
  });
});

describe("escrow: get-campaign", () => {
  beforeEach(() => {
    simnet.callPublicFn("escrow", "create-campaign", [Cl.uint(500), Cl.uint(1000000), Cl.principal(USDC_CONTRACT)], merchant);
  });

  it("returns campaign data after creation", () => {
    const result = simnet.callReadOnlyFn("escrow", "get-campaign", [Cl.uint(1)], merchant);
    expect(result.result).toBeSome();
  });

  it("returns none for non-existent campaign", () => {
    const result = simnet.callReadOnlyFn("escrow", "get-campaign", [Cl.uint(999)], merchant);
    expect(result.result).toBeNone();
  });
});

describe("escrow: set-commission-rate", () => {
  beforeEach(() => {
    simnet.callPublicFn("escrow", "create-campaign", [Cl.uint(500), Cl.uint(1000000), Cl.principal(USDC_CONTRACT)], merchant);
  });

  it("allows merchant to update commission rate", () => {
    const { result } = simnet.callPublicFn("escrow", "set-commission-rate", [Cl.uint(1), Cl.uint(1000)], merchant);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("rejects non-merchant caller", () => {
    const { result } = simnet.callPublicFn("escrow", "set-commission-rate", [Cl.uint(1), Cl.uint(1000)], other);
    expect(result).toBeErr(Cl.uint(100));
  });

  it("rejects rate above 10000 basis points", () => {
    const { result } = simnet.callPublicFn("escrow", "set-commission-rate", [Cl.uint(1), Cl.uint(10001)], merchant);
    expect(result).toBeErr(Cl.uint(101));
  });
});

describe("escrow: is-campaign-active", () => {
  it("returns false before deposit", () => {
    simnet.callPublicFn("escrow", "create-campaign", [Cl.uint(500), Cl.uint(1000000), Cl.principal(USDC_CONTRACT)], merchant);
    const result = simnet.callReadOnlyFn("escrow", "is-campaign-active", [Cl.uint(1)], merchant);
    expect(result.result).toBeOk(Cl.bool(false));
  });
});

describe("escrow: deduct-escrow", () => {
  it("rejects calls not from payout contract", () => {
    simnet.callPublicFn("escrow", "create-campaign", [Cl.uint(500), Cl.uint(1000000), Cl.principal(USDC_CONTRACT)], merchant);
    const { result } = simnet.callPublicFn("escrow", "deduct-escrow", [Cl.uint(1), Cl.uint(100)], merchant);
    expect(result).toBeErr(Cl.uint(100));
  });
});
