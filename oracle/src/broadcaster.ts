import {
  makeContractCall,
  broadcastTransaction,
  bufferCV,
  principalCV,
  uintCV,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

function getNetwork() {
  return process.env.STACKS_NETWORK === 'mainnet'
    ? new StacksMainnet()
    : new StacksTestnet({ url: process.env.STACKS_API_URL });
}

/**
 * Broadcasts a release-payout transaction to the Stacks blockchain.
 */
export async function broadcastPayout(
  saleId: Buffer,
  affiliate: string,
  campaignId: number,
  amount: number,
  sig: string,
  tokenContract: string
): Promise<string> {
  const network = getNetwork();
  const [tokenAddress, tokenName] = tokenContract.split('.');

  const tx = await makeContractCall({
    contractAddress: process.env.CONTRACT_DEPLOYER!,
    contractName: 'payout',
    functionName: 'release-payout',
    functionArgs: [
      bufferCV(saleId),
      principalCV(affiliate),
      uintCV(campaignId),
      uintCV(amount),
      bufferCV(Buffer.from(sig, 'hex')),
      principalCV(`${tokenAddress}.${tokenName}`),
    ],
    senderKey: process.env.ORACLE_PRIVATE_KEY!,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  });

  const result = await broadcastTransaction(tx, network);
  if ('error' in result) throw new Error(result.error);
  return result.txid;
}
