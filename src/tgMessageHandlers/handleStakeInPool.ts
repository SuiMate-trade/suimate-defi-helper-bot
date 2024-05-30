import aftermathSdk from '../utils/Aftermath/index.js';
import bot from '../utils/bot.js';
import { db } from '../utils/firebase.js';
import kriyaSdk from '../utils/KriyaDex/index.js';
import { convertToInternationalCurrencySystem } from '../utils/parseBignum.js';

export const handleViewPoolsProtocols = async (chatId: number) => {
  try {
    await bot.sendMessage(
      chatId,
      'Bot currently supports staking on the following protocols. Please select one to view the pools and apys.',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Aftermath Finance',
                callback_data: 'view_pools_in_aftermath',
              },
            ],
            [{ text: 'KriyaDEX', callback_data: 'view_pools_in_kriya' }],
          ],
        },
      },
    );
  } catch (error) {
    console.error(error);
  }
};

export const handleProtocolNameSelected = async (
  chatId: number,
  protocolName: string,
) => {
  try {
    if (protocolName === 'aftermath') {
      await handleViewPoolsInAftermath(chatId);
    }

    if (protocolName === 'kriya') {
      await handleViewPoolsInKriya(chatId);
    }
  } catch (error) {
    console.error(error);
  }
};

export const handleViewPoolsInKriya = async (chatId: number) => {
  try {
    const pools = await kriyaSdk.getAllPools();
    const parsedData = [];

    pools.forEach(async (pool) => {
      const { tokenX, tokenY, apy, tvl } = pool;
      const poolName = `${tokenX.tokenName}-${tokenY.tokenName}`;
      return parsedData.push([
        {
          text: `${poolName} Pool   APY:${apy.toFixed(2)}%    TVL: $${convertToInternationalCurrencySystem(tvl)}`,
          callback_data: `stake_pool_in_kriya_${poolName}`,
        },
      ]);
    });

    console.log(parsedData);
    await bot.sendMessage(
      chatId,
      'Found the following pools in KriyaDEX. Select a pool to stake in:',
      {
        reply_markup: {
          inline_keyboard: parsedData,
        },
      },
    );
  } catch (error) {
    console.error(error);
  }
};

export const handleKriyaPoolSelected = async (
  chatId: number,
  poolName: string,
) => {
  try {
    await db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('poolStaking')
      .set({
        poolName,
      });

    const tokenX = poolName.split('-')[0];
    const tokenY = poolName.split('-')[1];

    await bot.sendMessage(
      chatId,
      `You have selected ${poolName} pool. Please enter the amount of ${tokenX} and ${tokenY} you want to stake in the pool. Enter 0 if you want to provide one sided liquidity.`,
    );

    await bot.sendMessage(chatId, `Enter the amount of ${tokenX} to stake:`, {
      reply_markup: {
        force_reply: true,
      },
    });
  } catch (error) {
    console.error(error);
  }
};

export const handleViewPoolsInAftermath = async (chatId: number) => {
  try {
    const pools = await aftermathSdk.getAllPools();
    console.log(pools[0].pool.coins);

    const parsedData = [];

    await Promise.all(
      pools.map(async (pool) => {
        const coins = pool.pool.coins;
        const coinsTypeList = Object.keys(coins);
      }),
    );
  } catch (error) {
    console.error(error);
  }
};
