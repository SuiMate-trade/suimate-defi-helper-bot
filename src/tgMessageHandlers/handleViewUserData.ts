import bot from '../utils/bot.js';
import {
  getAddressForChatId,
  getDecryptedPrivateKeyForChatId,
} from '../utils/getAccountDataForChatId.js';
import getEllipsisTxt from '../utils/getEllipsisText.js';
import { toDecimalString } from '../utils/parseBignum.js';
import client from '../utils/sui.js';

export const handleViewAccountBalances = async (chatId: number) => {
  try {
    const address = await getAddressForChatId(chatId);
    const balances = await client.getAllBalances({
      owner: address,
    });

    const balanceString = await Promise.all(
      balances.map(async (balance) => {
        const { coinType } = balance;
        const coinMetadata = await client.getCoinMetadata({
          coinType,
        });

        return `🔸 ${coinMetadata.name}: ${toDecimalString(balance.totalBalance, coinMetadata.decimals, 2)}\n`;
      }),
    );

    await bot.sendMessage(
      chatId,
      balanceString.length
        ? `Your account balances for address ${getEllipsisTxt(address)} are:\n\n${balanceString.join(
            '',
          )}`
        : '😢 No balances found for your account',
    );
  } catch (error) {
    console.error(error);
  }
};

export const handleViewAddress = async (chatId: number) => {
  try {
    const address = await getAddressForChatId(chatId);
    await bot.sendMessage(chatId, `Your address is: ${address}`);
  } catch (error) {
    console.error(error);
  }
};

export const handleViewPrivateKey = async (
  chatId: number,
  password: string,
) => {
  try {
    const privateKey = await getDecryptedPrivateKeyForChatId(chatId, password);
    await bot.sendMessage(chatId, `Your private key is: ${privateKey}`);
  } catch (error) {
    console.error(error);
  }
};
