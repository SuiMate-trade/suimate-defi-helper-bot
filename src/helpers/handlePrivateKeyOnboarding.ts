import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { db } from '../utils/firebase.js';
import { encryptPrivateKey } from '../utils/securePrivateKey.js';

export const createNewAccount = async (password: string, chatId: number) => {
  try {
    const keypair = new Ed25519Keypair();
    const publicKey = Buffer.from(
      keypair.getPublicKey().toBase64(),
      'base64',
    ).toString('hex');
    const secretKey = keypair.getSecretKey();
    const address = keypair.getPublicKey().toSuiAddress();

    const encryptedPrivateKey = encryptPrivateKey(secretKey, password);

    await db.collection('users').doc(chatId.toString()).set({
      publicKey,
      encryptedPrivateKey,
      address,
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
