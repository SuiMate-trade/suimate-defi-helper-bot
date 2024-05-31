import bot from '../utils/bot.js';
import { getAddressForChatId } from '../utils/getAccountDataForChatId.js';
import client, { executeTransaction } from '../utils/sui.js';
import { toDecimalString } from '../utils/parseBignum.js';
import { db } from '../utils/firebase.js';
import SuiCoinsList from '../constants/suiCoinsList.js';
import aftermathSdk from '../utils/Aftermath/index.js';
import { promptForPassword } from './promptForPassword.js';

export const initiateSwap = async (chatId: number) => {
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

        return {
          text: `🔸 ${coinMetadata.symbol}. Balance: ${toDecimalString(balance.totalBalance, coinMetadata.decimals, 2)}`,
          callback_data: `swap_input_${coinMetadata.symbol}`,
        };
      }),
    );

    await bot.sendMessage(
      chatId,
      balanceString.length
        ? `Select a coin to swap for another coin:`
        : "😢 You don't have any balances in your account to swap",
      {
        reply_markup: {
          inline_keyboard: balanceString.map((balance) => [balance]),
        },
      },
    );
  } catch (error) {
    console.error(error);
  }
};

export const handleSwapInputCoinSelected = async (
  chatId: number,
  coinSymbol: string,
) => {
  try {
    await bot.sendMessage(
      chatId,
      `You selected ${coinSymbol} to swap. Please enter the name or symbol of the coin you want to receive. The bot will search through the list of supported coins and provide you with the matching options.`,
    );

    // Save the selected coin to the user's data in the database for later access
    await db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('swap')
      .set({
        coinFrom: coinSymbol,
      });

    await bot.sendMessage(chatId, `Enter the coin name or symbol`, {
      reply_markup: {
        force_reply: true,
      },
    });
  } catch (error) {
    console.error(error);
  }
};

export const handleSearchForSwapOutputCoin = async (
  chatId: number,
  searchQuery: string,
) => {
  try {
    const filteredCoins = SuiCoinsList.filter((coin) => {
      return (
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    if (!filteredCoins.length) {
      await bot.sendMessage(
        chatId,
        `No coins found for the search query: ${searchQuery}`,
      );
      return;
    }

    await bot.sendMessage(chatId, `Following coins matched your search:`, {
      reply_markup: {
        inline_keyboard: filteredCoins.map((coin) => [
          {
            text: `${coin.name} (${coin.symbol})`,
            callback_data: `swap_output_${coin.symbol}`,
          },
        ]),
      },
    });
  } catch (error) {
    console.error(error);
  }
};

export const handleSelectSwapOutputCoin = async (
  chatId: number,
  coinSymbol: string,
) => {
  try {
    const tempSwapRef = db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('swap');

    await tempSwapRef.update({
      coinTo: coinSymbol,
    });

    const swapData = await tempSwapRef.get();
    const { coinFrom } = swapData.data();

    await bot.sendMessage(
      chatId,
      `Enter the amount of ${coinFrom} you want to swap for ${coinSymbol}`,
      {
        reply_markup: {
          force_reply: true,
        },
      },
    );
  } catch (error) {
    console.error(error);
  }
};

export const handleSwapAmountEntered = async (
  chatId: number,
  amount: string,
) => {
  try {
    const tempSwapRef = db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('swap');

    const swapData = await tempSwapRef.get();
    const { coinFrom, coinTo } = swapData.data();

    if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(amount)) {
      await bot.sendMessage(chatId, 'Please enter a valid amount');
      await bot.sendMessage(
        chatId,
        `Enter the amount of ${coinFrom} you want to swap for ${coinTo}`,
        {
          reply_markup: {
            force_reply: true,
          },
        },
      );
      return;
    }

    await tempSwapRef.update({
      amount,
    });

    await bot.sendMessage(
      chatId,
      `You are swapping ${amount} ${coinFrom} for ${coinTo}. Please confirm the swap by clicking the button below.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Confirm Swap',
                callback_data: 'swap_confirm',
              },
            ],
          ],
        },
      },
    );
  } catch (error) {
    console.error(error);
  }
};

export const handleSwapConfirm = async (chatId: number) => {
  try {
    const tempSwapRef = db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('swap');

    const swapData = await tempSwapRef.get();
    const { coinFrom, coinTo, amount } = swapData.data();

    if (!coinFrom || !coinTo || !amount) {
      await bot.sendMessage(chatId, 'Please enter the swap details first');
      return;
    }

    await bot.sendMessage(
      chatId,
      `Finding the best trade routes for swapping ${amount} ${coinFrom} for ${coinTo} ...`,
    );

    const aftermathRoute = await aftermathSdk.getSwapRoute(
      coinFrom,
      coinTo,
      amount,
    );

    if (aftermathRoute) {
      await bot.sendMessage(chatId, `Found the following routes:`, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Aftermath Route, Output: ${aftermathRoute.outputAmount} ${coinTo}`,
                callback_data: 'confirm_perform_swap_aftermath',
              },
            ],
          ],
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
};

export const handleConfirmSwapStart = async (
  chatId: number,
  routerId: string,
) => {
  try {
    const tempSwapRef = db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('swap');

    await tempSwapRef.update({
      routerId,
    });

    await promptForPassword(chatId, 'swap');
  } catch (error) {
    console.error(error);
  }
};

export const handlePasswordEnteredForSwap = async (
  chatId: number,
  password: string,
) => {
  try {
    const tempSwapRef = db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('swap');

    const swapData = await tempSwapRef.get();
    const { coinFrom, coinTo, amount, routerId } = swapData.data();

    const address = await getAddressForChatId(chatId);

    if (!coinFrom || !coinTo || !amount || !routerId) {
      await bot.sendMessage(chatId, 'Please enter the swap details first');
      return;
    }

    if (routerId === 'aftermath') {
      await bot.sendMessage(
        chatId,
        `Swapping ${amount} ${coinFrom} for ${coinTo} using Aftermath Route ...`,
      );

      const aftermathRoute = await aftermathSdk.getSwapRoute(
        coinFrom,
        coinTo,
        amount,
      );

      if (!aftermathRoute) {
        await bot.sendMessage(chatId, 'No route found for the swap');
        return;
      }

      const { coinIn, coinOut, spotPrice, routes, referrer, externalFee } =
        aftermathRoute;
      const txb = await aftermathSdk.performSwap(address, {
        coinIn,
        coinOut,
        spotPrice,
        routes,
        referrer,
        externalFee,
      });

      if (!txb) {
        await bot.sendMessage(chatId, 'Something went wrong!');
        return;
      }

      // @ts-ignore
      const txnResult = await executeTransaction(txb, chatId, password);

      console.log('txnResult', txnResult);
      await bot.sendMessage(
        chatId,
        `Transaction success. View on explorer here: https://suivision.xyz/txblock/${txnResult.digest}`,
      );
    }
  } catch (error) {
    console.error(error);
  }
};
