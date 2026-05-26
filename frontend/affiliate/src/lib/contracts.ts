import { StacksTestnet } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import {
  stringAsciiCV,
  principalCV,
  AnchorMode,
  PostConditionMode,
  callReadOnlyFunction,
  cvToValue,
  ClarityValue,
} from '@stacks/transactions';

const network = new StacksTestnet();
const CONTRACT_DEPLOYER = process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER!;

export interface AffiliateStats {
  payoutAsset: string;
  totalConversions: number;
  totalEarned: number;
  registeredAt: number;
  active: boolean;
}

async function readOnly(contractName: string, fn: string, args: ClarityValue[], sender: string) {
  const result = await callReadOnlyFunction({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName,
    functionName: fn,
    functionArgs: args,
    senderAddress: sender,
  });
  return cvToValue(result);
}

export async function getAffiliateStats(address: string): Promise<AffiliateStats | null> {
  const raw = await readOnly('affiliate', 'get-affiliate', [principalCV(address)], address);
  if (!raw) return null;
  return {
    payoutAsset: raw['payout-asset'],
    totalConversions: Number(raw['total-conversions']),
    totalEarned: Number(raw['total-earned']),
    registeredAt: Number(raw['registered-at']),
    active: raw.active,
  };
}

export async function isRegistered(address: string): Promise<boolean> {
  const raw = await readOnly('affiliate', 'is-registered', [principalCV(address)], address);
  return Boolean(raw);
}

export async function registerAffiliate(payoutAsset: 'USDC' | 'sBTC') {
  await openContractCall({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName: 'affiliate',
    functionName: 'register',
    functionArgs: [stringAsciiCV(payoutAsset)],
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => console.log('Registered:', data.txId),
    onCancel: () => {},
  });
}

export async function updatePayoutAsset(payoutAsset: 'USDC' | 'sBTC') {
  await openContractCall({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName: 'affiliate',
    functionName: 'set-payout-asset',
    functionArgs: [stringAsciiCV(payoutAsset)],
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => console.log('Asset updated:', data.txId),
    onCancel: () => {},
  });
}

export function buildReferralLink(merchantUrl: string, affiliateAddress: string): string {
  const url = new URL(merchantUrl);
  url.searchParams.set('ref', affiliateAddress);
  return url.toString();
}
