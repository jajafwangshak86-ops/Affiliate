import { StacksTestnet } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { stringAsciiCV, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { callReadOnlyFunction, cvToValue } from '@stacks/transactions';

const network = new StacksTestnet();
const CONTRACT_DEPLOYER = process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER!;

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
    onCancel: () => console.log('Cancelled'),
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
    onCancel: () => console.log('Cancelled'),
  });
}

export async function getAffiliateStats(address: string) {
  const result = await callReadOnlyFunction({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName: 'affiliate',
    functionName: 'get-affiliate',
    functionArgs: [],
    senderAddress: address,
  });
  return cvToValue(result);
}
