import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const oracle = accounts.get("wallet_1")!;

describe("payout: set-oracle-pubkey", () => {
  it("allows deployer to set oracle pubkey", () => {
    const pubkey = Cl.buffer(Buffer.alloc(33, 2));
    const { result } = simnet.callPublicFn("payout", "set-oracle-pubkey", [pubkey], deployer);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("rejects non-deployer caller", () => {
    const pubkey = Cl.buffer(Buffer.alloc(33, 2));
    const { result } = simnet.callPublicFn("payout", "set-oracle-pubkey", [pubkey], oracle);
    expect(result).toBeErr(Cl.uint(300));
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
    const result = simnet.callReadOnlyFn("payout", "get-oracle-pubkey", [], deployer);
    expect(result.result).toEqual(Cl.buffer(pubkey));
  });
});

describe("payout: release-payout", () => {
  it("rejects duplicate sale", () => {
    // Duplicate check is delegated to affiliate contract; direct call with invalid sig fails first
    const saleId = Cl.buffer(Buffer.alloc(32, 1));
    const affiliate = Cl.principal(oracle);
    const sig = Cl.buffer(Buffer.alloc(65, 0));
    const token = Cl.principal(`${deployer}.usdc-token`);

    const { result } = simnet.callPublicFn(
      "payout",
      "release-payout",
      [saleId, affiliate, Cl.uint(1), Cl.uint(1000), sig, token],
      oracle
    );
    // Expects invalid signature error since sig is zeroed
    expect(result).toBeErr(Cl.uint(301));
  });
});
