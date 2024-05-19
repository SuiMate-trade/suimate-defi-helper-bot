import bot from '../utils/bot.js';

export const promptForPassword = async (chatId: number, purpose: string) => {
  try {
    await bot.sendMessage(chatId, `Please enter your password to ${purpose}`, {
      reply_markup: {
        force_reply: true,
      },
    });
  } catch (error) {
    console.error(error);
  }
};
