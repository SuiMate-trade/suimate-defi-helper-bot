import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import * as bip39 from '@scure/bip39';
import * as english from '@scure/bip39/wordlists/english';
import { db } from '../utils/firebase.js';
import { encryptPrivateKey } from '../utils/securePrivateKey.js';

export const createNewAccount = async (
  password: string,
  chatId: number,
  name: string,
  username: string,
) => {
  try {
    const mnemonic = bip39.generateMnemonic(english.wordlist);
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

    const publicKey = Buffer.from(
      keypair.getPublicKey().toBase64(),
      'base64',
    ).toString('hex');

    const secretKey = keypair.getSecretKey();
    const address = keypair.getPublicKey().toSuiAddress();

    const encryptedPrivateKey = encryptPrivateKey(secretKey, password);
    const encryptedMnemonic = encryptPrivateKey(mnemonic, password);

    await db.collection('users').doc(chatId.toString()).set({
      publicKey,
      encryptedPrivateKey,
      encryptedMnemonic,
      address,
      name,
      username,
    });

    return {
      publicKey,
      secretKey,
      address,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};
