import aftermathSdk from '../utils/Aftermath/index.js';
import bot from '../utils/bot.js';
import { db } from '../utils/firebase.js';
import { getAddressForChatId } from '../utils/getAccountDataForChatId.js';
import { executeTransaction, getValidatorsList } from '../utils/sui.js';
import { promptForPassword } from './promptForPassword.js';

export const handleViewActiveValidators = async (chatId: number) => {
  try {
    const validatorsList = await getValidatorsList();

    const validatorsListMessage = validatorsList
      .map((validator) => `🔹 ${validator.name} - APY: ${validator.apy}%`)
      .join('\n');

    await bot.sendMessage(
      chatId,
      `Active Validators List. Stake to get afSui\n\n${validatorsListMessage}`,
    );

    await bot.sendMessage(chatId, `Enter the name of the validator to stake`, {
      reply_markup: {
        force_reply: true,
      },
    });
  } catch (error) {
    console.error(`Error in getValidatorsList: ${error.message}`);
  }
};

export const handleValidatorNameSelected = async (
  chatId: number,
  validatorName: string,
) => {
  try {
    await bot.sendMessage(
      chatId,
      `Enter the amount of SUI to stake to ${validatorName}`,
      {
        reply_markup: {
          force_reply: true,
        },
      },
    );
  } catch (error) {
    console.error(`Error in handleValidatorNameSelected: ${error.message}`);
  }
};

export const handleStakeAmountEntered = async (
  chatId: number,
  validatorName: string,
  amount: string,
) => {
  try {
    if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(amount)) {
      await bot.sendMessage(chatId, 'Please enter a valid amount');
      await handleValidatorNameSelected(chatId, validatorName);
      return;
    }

    if (parseFloat(amount) < 1) {
      await bot.sendMessage(chatId, `Minimum amount to stake is 1 SUI`);
      await handleValidatorNameSelected(chatId, validatorName);
      return;
    }
    await bot.sendMessage(chatId, `Staking ${amount} SUI to ${validatorName}`);

    const validatorsList = await getValidatorsList();
    const validator = validatorsList.find((v) => v.name === validatorName);

    if (!validator) {
      await bot.sendMessage(
        chatId,
        'Validator not found. Please enter the correct validator name.',
      );
      await handleViewActiveValidators(chatId);
      return;
    }

    const tempLiquidStakingRef = db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('liquidStaking');

    await tempLiquidStakingRef.set({
      validator,
      amount,
    });

    await promptForPassword(chatId, 'liquid stake');
  } catch (error) {
    console.error(`Error in handleStakeAmountEntered: ${error.message}`);
  }
};

export const handlePasswordEnteredForLiquidStaking = async (
  chatId: number,
  password: string,
) => {
  try {
    const tempLiquidStakingRef = db
      .collection('users')
      .doc(chatId.toString())
      .collection('tempSessions')
      .doc('liquidStaking');

    const liquidStakingData = await tempLiquidStakingRef.get();
    const { validator, amount } = liquidStakingData.data();

    const address = await getAddressForChatId(chatId);

    const txb = await aftermathSdk.performLiquidStaking(
      address,
      validator.address,
      amount,
    );

    if (!txb) {
      await bot.sendMessage(chatId, 'Something went wrong!');
      return;
    }

    const txnResult = await executeTransaction(txb, chatId, password);

    if (!txnResult) {
      throw new Error('Transaction failed');
    }

    await bot.sendMessage(
      chatId,
      `Transaction success. View on explorer here: https://suivision.xyz/txblock/${txnResult.digest}`,
    );

    await tempLiquidStakingRef.delete();
  } catch (error) {
    console.error(
      `Error in handlePasswordEnteredForLiquidStaking: ${error.message}`,
    );
  }
};
