import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const affiliate1 = accounts.get("wallet_1")!;
const affiliate2 = accounts.get("wallet_2")!;

describe("affiliate: register", () => {
  it("registers with USDC payout asset", () => {
    const { result } = simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliate1);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("registers with sBTC payout asset", () => {
    const { result } = simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("sBTC")], affiliate2);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("rejects duplicate registration", () => {
    simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliate1);
    const { result } = simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliate1);
    expect(result).toBeErr(Cl.uint(200));
  });

  it("rejects invalid payout asset", () => {
    const { result } = simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("ETH")], affiliate1);
    expect(result).toBeErr(Cl.uint(204));
  });
});

describe("affiliate: is-registered", () => {
  it("returns false before registration", () => {
    const result = simnet.callReadOnlyFn("affiliate", "is-registered", [Cl.principal(affiliate1)], affiliate1);
    expect(result.result).toBeBool(false);
  });

  it("returns true after registration", () => {
    simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliate1);
    const result = simnet.callReadOnlyFn("affiliate", "is-registered", [Cl.principal(affiliate1)], affiliate1);
    expect(result.result).toBeBool(true);
  });
});

describe("affiliate: set-payout-asset", () => {
  it("updates payout asset for registered affiliate", () => {
    simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliate1);
    const { result } = simnet.callPublicFn("affiliate", "set-payout-asset", [Cl.stringAscii("sBTC")], affiliate1);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("rejects update for unregistered affiliate", () => {
    const { result } = simnet.callPublicFn("affiliate", "set-payout-asset", [Cl.stringAscii("sBTC")], affiliate1);
    expect(result).toBeErr(Cl.uint(201));
  });

  it("rejects invalid asset on update", () => {
    simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliate1);
    const { result } = simnet.callPublicFn("affiliate", "set-payout-asset", [Cl.stringAscii("DAI")], affiliate1);
    expect(result).toBeErr(Cl.uint(204));
  });
});

describe("affiliate: is-sale-processed", () => {
  it("returns false for unprocessed sale", () => {
    const saleId = Cl.buffer(Buffer.alloc(32, 1));
    const result = simnet.callReadOnlyFn("affiliate", "is-sale-processed", [saleId], affiliate1);
    expect(result.result).toBeBool(false);
  });
});

describe("affiliate: record-conversion", () => {
  it("rejects calls not from payout contract", () => {
    simnet.callPublicFn("affiliate", "register", [Cl.stringAscii("USDC")], affiliate1);
    const saleId = Cl.buffer(Buffer.alloc(32, 1));
    const { result } = simnet.callPublicFn(
      "affiliate",
      "record-conversion",
      [Cl.principal(affiliate1), saleId, Cl.uint(1), Cl.uint(1000)],
      affiliate1
    );
    expect(result).toBeErr(Cl.uint(202));
  });
});
