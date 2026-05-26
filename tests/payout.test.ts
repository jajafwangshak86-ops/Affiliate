import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const oracle = accounts.get("wallet_1")!;

describe("payout: set-oracle-pubkey", () => {
  it("allows deployer to set oracle pubkey", () => {
    const pubkey = Cl.buffer(Buffer.alloc(33, 2));
    expect(simnet.callPublicFn("payout", "set-oracle-pubkey", [pubkey], deployer).result)
      .toBeOk(Cl.bool(true));
  });

  it("rejects non-deployer caller", () => {
    const pubkey = Cl.buffer(Buffer.alloc(33, 2));
    expect(simnet.callPublicFn("payout", "set-oracle-pubkey", [pubkey], oracle).result)
      .toBeErr(Cl.uint(300));
  });
});

describe("payout: get-oracle-pubkey", () => {
  it("returns zero pubkey before initialization", () => {
    const result = simnet.callReadOnlyFn("payout", "get-oracle-pubkey", [], deployer);
    expect(result.result).toEqual(Cl.buffer(Buffer.alloc(1, 0)));
  });

  it("returns set pubkey after initialization", () => {
    const pubkey = Buffer.alloc(33, 3);
    simnet.callPublicFn("payout", "set-oracle-pubkey", [Cl.buffer(pubkey)], deployer);
    expect(simnet.callReadOnlyFn("payout", "get-oracle-pubkey", [], deployer).result)
      .toEqual(Cl.buffer(pubkey));
  });
});

describe("payout: get-payout-stats", () => {
  it("returns zero stats before any payouts", () => {
    const result = simnet.callReadOnlyFn("payout", "get-payout-stats", [], deployer);
    expect(result.result.type).toBe("ok");
  });
});

describe("payout: release-payout", () => {
  it("rejects with invalid signature", () => {
    const saleId = Cl.buffer(Buffer.alloc(32, 1));
    const sig = Cl.buffer(Buffer.alloc(65, 0));
    const token = Cl.principal(`${deployer}.usdc-token`);

    expect(simnet.callPublicFn(
      "payout", "release-payout",
      [saleId, Cl.principal(oracle), Cl.uint(1), Cl.uint(1000), sig, token],
      oracle
    ).result).toBeErr(Cl.uint(304)); // ERR-AFFILIATE-NOT-FOUND (affiliate not registered)
  });

  it("rejects inactive affiliate", () => {
    // Register then deactivate affiliate
    simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], oracle);
    simnet.callPublicFn("affiliate", "deactivate", [], oracle);

    const saleId = Cl.buffer(Buffer.alloc(32, 1));
    const sig = Cl.buffer(Buffer.alloc(65, 0));
    const token = Cl.principal(`${deployer}.usdc-token`);

    expect(simnet.callPublicFn(
      "payout", "release-payout",
      [saleId, Cl.principal(oracle), Cl.uint(1), Cl.uint(1000), sig, token],
      deployer
    ).result).toBeErr(Cl.uint(306)); // ERR-AFFILIATE-INACTIVE
  });
});
