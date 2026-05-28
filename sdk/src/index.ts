import {
  StacksTestnet,
  StacksMainnet,
  StacksNetwork,
} from '@stacks/network';
import {
  callReadOnlyFunction,
  cvToValue,
  uintCV,
  stringAsciiCV,
  principalCV,
  ClarityValue,
} from '@stacks/transactions';

export interface AffiliateNetworkConfig {
  network: 'mainnet' | 'testnet';
  contractDeployer: string;
}

export interface Campaign {
  merchant: string;
  commissionRate: number;
  escrowBalance: number;
  escrowFloor: number;
  token: string;
  active: boolean;
}

export interface AffiliateStats {
  payoutAsset: string;
  totalConversions: number;
  totalEarned: number;
  registeredAt: number;
  active: boolean;
}

export interface PayoutStats {
  payoutCount: number;
  totalPaidOut: number;
}

export class AffiliateNetwork {
  private network: StacksNetwork;
  private deployer: string;

  constructor(config: AffiliateNetworkConfig) {
    this.network = config.network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
    this.deployer = config.contractDeployer;
  }

  private async readOnly(
    contractName: string,
    fn: string,
    args: ClarityValue[],
    sender: string
  ) {
    const result = await callReadOnlyFunction({
      network: this.network,
      contractAddress: this.deployer,
      contractName,
      functionName: fn,
      functionArgs: args,
      senderAddress: sender,
    });
    return cvToValue(result);
  }

  async getCampaign(campaignId: number, sender: string): Promise<Campaign | null> {
    const raw = await this.readOnly('escrow-v2', 'get-campaign', [uintCV(campaignId)], sender);
    if (!raw) return null;
    return {
      merchant: raw.merchant,
      commissionRate: Number(raw['commission-rate']),
      escrowBalance: Number(raw['escrow-balance']),
      escrowFloor: Number(raw['escrow-floor']),
      token: raw.token,
      active: raw.active,
    };
  }

  async getAffiliateStats(address: string): Promise<AffiliateStats | null> {
    const raw = await this.readOnly('affiliate-v2', 'get-affiliate', [principalCV(address)], address);
    if (!raw) return null;
    return {
      payoutAsset: raw['payout-asset'],
      totalConversions: Number(raw['total-conversions']),
      totalEarned: Number(raw['total-earned']),
      registeredAt: Number(raw['registered-at']),
      active: raw.active,
    };
  }

  async isRegistered(address: string): Promise<boolean> {
    const raw = await this.readOnly('affiliate-v2', 'is-registered', [principalCV(address)], address);
    return Boolean(raw);
  }

  async getPayoutStats(sender: string): Promise<PayoutStats> {
    const raw = await this.readOnly('payout-v2', 'get-payout-stats', [], sender);
    return {
      payoutCount: Number(raw?.['payout-count'] ?? 0),
      totalPaidOut: Number(raw?.['total-paid-out'] ?? 0),
    };
  }

  buildReferralLink(merchantUrl: string, affiliateAddress: string): string {
    const url = new URL(merchantUrl);
    url.searchParams.set('ref', affiliateAddress);
    return url.toString();
  }
}

export { AffiliateNetworkConfig as Config };
