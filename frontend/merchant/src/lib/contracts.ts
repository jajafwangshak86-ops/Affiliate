import { StacksTestnet } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import {
  uintCV,
  principalCV,
  AnchorMode,
  PostConditionMode,
  callReadOnlyFunction,
  cvToValue,
  ClarityValue,
} from '@stacks/transactions';

const network = new StacksTestnet();
const CONTRACT_DEPLOYER = process.env.NEXT_PUBLIC_CONTRACT_DEPLOYER!;

export interface Campaign {
  merchant: string;
  commissionRate: number;
  escrowBalance: number;
  escrowFloor: number;
  token: string;
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

export async function getCampaign(campaignId: number, sender: string): Promise<Campaign | null> {
  const raw = await readOnly('escrow', 'get-campaign', [uintCV(campaignId)], sender);
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

export async function getEscrowBalance(campaignId: number, sender: string): Promise<number> {
  const val = await readOnly('escrow', 'get-escrow-balance', [uintCV(campaignId)], sender);
  return Number(val);
}

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
    onCancel: () => {},
  });
}

export async function depositEscrow(campaignId: number, amount: number, tokenContract: string) {
  await openContractCall({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName: 'escrow',
    functionName: 'deposit',
    functionArgs: [uintCV(campaignId), uintCV(amount), principalCV(tokenContract)],
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => console.log('Deposited:', data.txId),
    onCancel: () => {},
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
    onCancel: () => {},
  });
}

export async function pauseCampaign(campaignId: number) {
  await openContractCall({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName: 'escrow',
    functionName: 'pause-campaign',
    functionArgs: [uintCV(campaignId)],
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => console.log('Campaign paused:', data.txId),
    onCancel: () => {},
  });
}

export async function resumeCampaign(campaignId: number) {
  await openContractCall({
    network,
    contractAddress: CONTRACT_DEPLOYER,
    contractName: 'escrow',
    functionName: 'resume-campaign',
    functionArgs: [uintCV(campaignId)],
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => console.log('Campaign resumed:', data.txId),
    onCancel: () => {},
  });
}
