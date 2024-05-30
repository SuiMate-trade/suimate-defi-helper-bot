import { SuiHTTPTransport, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { type TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_RPC_ENDPOINT } from '../constants/index.js';
import { getDecryptedMnemonicForChatId } from './getAccountDataForChatId.js';

export function calculateAPY(apy: number, roundDecimals = 4) {
  return parseFloat((apy * 100).toFixed(roundDecimals));
}

const client = new SuiClient({
  transport: new SuiHTTPTransport({
    url: SUI_RPC_ENDPOINT,
  }),
});

export const executeTransaction = async (
  txb: TransactionBlock,
  chatId: number,
  password: string,
) => {
  try {
    const mnemonic = await getDecryptedMnemonicForChatId(chatId, password);
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

    const bytes = await txb.build({
      client,
    });
    const serializedSignature = (await keypair.signTransactionBlock(bytes))
      .signature;

    // verify the signature locally
    const verifySignature = await keypair
      .getPublicKey()
      .verifyTransactionBlock(bytes, serializedSignature);

    if (!verifySignature) {
      throw new Error('Signature verification failed');
    }

    // execute transaction.
    const res = await client.executeTransactionBlock({
      transactionBlock: bytes,
      signature: serializedSignature,
    });

    return res;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getValidatorsList = async () => {
  try {
    const state = await client.getLatestSuiSystemState();
    const { activeValidators, epoch } = state;
    const { apys } = await client.getValidatorsApy();

    const validatorsList = activeValidators.slice(0, 20).map((validator) => ({
      name: validator.name,
      address: validator.suiAddress,
      imageUrl: validator.imageUrl,
      apy: calculateAPY(
        apys.filter((d) => d.address === validator.suiAddress)[0]?.apy || 0,
      ),
      totalStaked: validator.stakingPoolSuiBalance,
      epoch,
    }));

    return validatorsList;
  } catch (error) {
    console.error(`Error in getValidatorsList: ${error.message}`);
    return [];
  }
};

export const getCoinMetadata = async (coinType: string) => {
  try {
    const coinMetadata = await client.getCoinMetadata({
      coinType,
    });

    return coinMetadata;
  } catch (err) {
    console.error(`Error in getCoinMetadata: ${err.message}`);
    return null;
  }
};

export default client;
