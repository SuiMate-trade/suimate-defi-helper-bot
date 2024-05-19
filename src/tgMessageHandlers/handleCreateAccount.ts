import { createNewAccount } from '../helpers/handlePrivateKeyOnboarding.js';
import bot from '../utils/bot.js';
import { handleUserAlreadyExists } from './handleStart.js';

export const handleOnboardUsingPrivateKey = async (
  chatId: number,
  password: string,
  name: string,
  username: string,
) => {
  await bot.sendMessage(
    chatId,
    `Creating a new account for you. Please wait...`,
  );

  const { address, publicKey, secretKey } = await createNewAccount(
    password,
    chatId,
    name,
    username,
  );

  await bot.sendMessage(
    chatId,
    `Your account has been created successfully 🎉🎉🎉 \n\n▸ Address: ${address}\n▸ Public Key: ${publicKey}\n▸ Private Key: ${secretKey} \n\n🔐 Your private key has been encrypted with the password you provided. Make sure to remember the password to make transactions from the bot.`,
  );

  await handleUserAlreadyExists(chatId);
};
