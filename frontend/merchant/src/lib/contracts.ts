import { StacksTestnet } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { uintCV, principalCV, AnchorMode, PostConditionMode } from '@stacks/transactions';

const network = new StacksTestnet();
const CONTRACT_DEPLOYER = process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER!;

export async function createCampaign(commissionRate: number, escrowFloor: number, tokenContract: string) {
  await openContractCall({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName: 'escrow',
    functionName: 'create-campaign',
    functionArgs: [uintCV(commissionRate), uintCV(escrowFloor), principalCV(tokenContract)],
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => console.log('Campaign created:', data.txId),
    onCancel: () => console.log('Cancelled'),
  });
}

export async function setCommissionRate(campaignId: number, rate: number) {
  await openContractCall({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName: 'escrow',
    functionName: 'set-commission-rate',
    functionArgs: [uintCV(campaignId), uintCV(rate)],
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => console.log('Rate updated:', data.txId),
    onCancel: () => console.log('Cancelled'),
  });
}
