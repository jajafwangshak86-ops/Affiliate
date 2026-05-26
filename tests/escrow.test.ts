import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const merchant = accounts.get("wallet_1")!;
const other = accounts.get("wallet_2")!;

const USDC_CONTRACT = `${deployer}.usdc-token`;

function createCampaign(caller = merchant) {
  return simnet.callPublicFn(
    "escrow", "create-campaign",
    [Cl.uint(500), Cl.uint(1_000_000), Cl.principal(USDC_CONTRACT)],
    caller
  );
}

describe("escrow: create-campaign", () => {
  it("creates a campaign and returns campaign id 1", () => {
    expect(createCampaign().result).toBeOk(Cl.uint(1));
  });

  it("increments campaign id on second creation", () => {
    createCampaign();
    expect(createCampaign().result).toBeOk(Cl.uint(2));
  });
});

describe("escrow: get-next-campaign-id", () => {
  it("returns 1 before any campaigns", () => {
    const result = simnet.callReadOnlyFn("escrow", "get-next-campaign-id", [], merchant);
    expect(result.result).toEqual(Cl.uint(1));
  });

  it("returns 2 after one campaign created", () => {
    createCampaign();
    const result = simnet.callReadOnlyFn("escrow", "get-next-campaign-id", [], merchant);
    expect(result.result).toEqual(Cl.uint(2));
  });
});

describe("escrow: get-campaign", () => {
  beforeEach(() => { createCampaign(); });

  it("returns campaign data after creation", () => {
    const result = simnet.callReadOnlyFn("escrow", "get-campaign", [Cl.uint(1)], merchant);
    expect(result.result.type).toBe("some");
  });

  it("returns none for non-existent campaign", () => {
    const result = simnet.callReadOnlyFn("escrow", "get-campaign", [Cl.uint(999)], merchant);
    expect(result.result).toBeNone();
  });
});

describe("escrow: get-commission-rate", () => {
  it("returns commission rate after creation", () => {
    createCampaign();
    const result = simnet.callReadOnlyFn("escrow", "get-commission-rate", [Cl.uint(1)], merchant);
    expect(result.result).toBeOk(Cl.uint(500));
  });

  it("returns error for missing campaign", () => {
    const result = simnet.callReadOnlyFn("escrow", "get-commission-rate", [Cl.uint(99)], merchant);
    expect(result.result).toBeErr(Cl.uint(102));
  });
});

describe("escrow: set-commission-rate", () => {
  beforeEach(() => { createCampaign(); });

  it("allows merchant to update commission rate", () => {
    expect(simnet.callPublicFn("escrow", "set-commission-rate", [Cl.uint(1), Cl.uint(1000)], merchant).result)
      .toBeOk(Cl.bool(true));
  });

  it("rejects non-merchant caller", () => {
    expect(simnet.callPublicFn("escrow", "set-commission-rate", [Cl.uint(1), Cl.uint(1000)], other).result)
      .toBeErr(Cl.uint(100));
  });

  it("rejects rate above 10000 basis points", () => {
    expect(simnet.callPublicFn("escrow", "set-commission-rate", [Cl.uint(1), Cl.uint(10001)], merchant).result)
      .toBeErr(Cl.uint(101));
  });
});

describe("escrow: update-escrow-floor", () => {
  beforeEach(() => { createCampaign(); });

  it("allows merchant to update escrow floor", () => {
    expect(simnet.callPublicFn("escrow", "update-escrow-floor", [Cl.uint(1), Cl.uint(2_000_000)], merchant).result)
      .toBeOk(Cl.bool(true));
  });

  it("rejects floor below minimum", () => {
    expect(simnet.callPublicFn("escrow", "update-escrow-floor", [Cl.uint(1), Cl.uint(500_000)], merchant).result)
      .toBeErr(Cl.uint(101));
  });

  it("rejects non-merchant caller", () => {
    expect(simnet.callPublicFn("escrow", "update-escrow-floor", [Cl.uint(1), Cl.uint(2_000_000)], other).result)
      .toBeErr(Cl.uint(100));
  });
});

describe("escrow: pause-campaign and resume-campaign", () => {
  it("cannot pause an already inactive campaign", () => {
    createCampaign();
    // campaign starts inactive (no deposit)
    expect(simnet.callPublicFn("escrow", "pause-campaign", [Cl.uint(1)], merchant).result)
      .toBeErr(Cl.uint(106)); // ERR-CAMPAIGN-ALREADY-PAUSED
  });

  it("cannot resume a campaign with insufficient balance", () => {
    createCampaign();
    expect(simnet.callPublicFn("escrow", "resume-campaign", [Cl.uint(1)], merchant).result)
      .toBeErr(Cl.uint(103)); // ERR-ESCROW-BELOW-FLOOR
  });

  it("rejects pause from non-merchant", () => {
    createCampaign();
    expect(simnet.callPublicFn("escrow", "pause-campaign", [Cl.uint(1)], other).result)
      .toBeErr(Cl.uint(100));
  });
});

describe("escrow: is-campaign-active", () => {
  it("returns false before deposit", () => {
    createCampaign();
    const result = simnet.callReadOnlyFn("escrow", "is-campaign-active", [Cl.uint(1)], merchant);
    expect(result.result).toBeOk(Cl.bool(false));
  });
});

describe("escrow: deduct-escrow", () => {
  it("rejects calls not from payout contract", () => {
    createCampaign();
    expect(simnet.callPublicFn("escrow", "deduct-escrow", [Cl.uint(1), Cl.uint(100)], merchant).result)
      .toBeErr(Cl.uint(100));
  });
});
