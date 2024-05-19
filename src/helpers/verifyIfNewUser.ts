import { db } from '../utils/firebase.js';

export const verifyIfNewUser = async (chatId: string) => {
  try {
    const userData = await db.collection('users').doc(chatId).get();
    if (userData.exists) return false;
    return true;
  } catch (err) {
    return true;
  }
};
