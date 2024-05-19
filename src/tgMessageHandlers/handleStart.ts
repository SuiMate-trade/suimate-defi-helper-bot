import { verifyIfNewUser } from '../helpers/verifyIfNewUser.js';
import bot from '../utils/bot.js';

export const handleStart = async (chatId: number) => {
  try {
    const isNewUser = await verifyIfNewUser(`${chatId}`);
    if (isNewUser) {
      await handleUserNotExists(chatId);
    } else {
      await handleUserAlreadyExists(chatId);
    }
  } catch (error) {
    console.error(error);
  }
};

export const handleUserNotExists = async (chatId: number) => {
  await bot.sendMessage(
    chatId,
    `Seems like you don't have an account registered with Suimate.\n\nTo interact with the defi dapps, the bot will create a new wallet for you. To keep things self-custodial, we enforce zkLogin for creating a new wallet.\n\nThe bot will have MPC option to create a wallet too in the future`,
  );

  await bot.sendMessage(chatId, `Select an option to onboard.`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 Password protected private key',
            callback_data: 'start_pk_onboarding',
          },
        ],
        [
          {
            text: '🚀 Self custodial zkLogin',
            callback_data: 'start_zklogin_onboarding',
          },
        ],
      ],
    },
  });
};

export const handleUserAlreadyExists = async (chatId: number) => {
  try {
    await bot.sendMessage(
      chatId,
      `Welcome to Suimate! You can now interact with any DeFi dapp on Sui directly with this bot.\n\nSelect a dapp to interact with.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'KriyaDEX',
                callback_data: 'view_kriyadex',
              },
            ],
            [
              {
                text: 'More DEXs coming soon 🔜',
                callback_data: 'coming_soon',
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
