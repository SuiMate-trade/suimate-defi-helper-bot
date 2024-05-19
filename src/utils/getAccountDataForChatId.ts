import { db } from './firebase.js';
import { decryptPrivateKey } from './securePrivateKey.js';

export const getAddressForChatId = async (chatId: number) => {
  try {
    const userData = await db.collection('users').doc(`${chatId}`).get();
    if (userData.exists) {
      return userData.data().address;
    }
    return '';
  } catch (error) {
    console.error(error);
    return '';
  }
};

export const getDecryptedPrivateKeyForChatId = async (
  chatId: number,
  password: string,
) => {
  try {
    const userData = await db.collection('users').doc(`${chatId}`).get();
    if (userData.exists) {
      const encryptedPrivateKey = userData.data().encryptedPrivateKey;
      const decryptedPrivateKey = await decryptPrivateKey(
        password,
        encryptedPrivateKey,
      );
      return decryptedPrivateKey;
    }
    return '';
  } catch (error) {
    console.error(error);
    return '';
  }
};
