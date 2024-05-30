import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {
  decodeToken,
  generateGoogleOauthUrl,
  getUserAddress,
  getZeroKnowledgeProof,
} from './helpers/handleZkLogin.js';
import bot from './utils/bot.js';
import { handleStart } from './tgMessageHandlers/handleStart.js';
import { handleOnboardUsingPrivateKey } from './tgMessageHandlers/handleCreateAccount.js';
import {
  handleViewAccountBalances,
  handleViewAddress,
  handleViewPrivateKey,
} from './tgMessageHandlers/handleViewUserData.js';
import { promptForPassword } from './tgMessageHandlers/promptForPassword.js';
import {
  handleConfirmSwapStart,
  handlePasswordEnteredForSwap,
  handleSearchForSwapOutputCoin,
  handleSelectSwapOutputCoin,
  handleSwapAmountEntered,
  handleSwapConfirm,
  handleSwapInputCoinSelected,
  initiateSwap,
} from './tgMessageHandlers/handleSwap.js';
import {
  handlePasswordEnteredForLiquidStaking,
  handleStakeAmountEntered,
  handleValidatorNameSelected,
  handleViewActiveValidators,
} from './tgMessageHandlers/handleValidatorStaking.js';
import {
  handleProtocolNameSelected,
  handleViewPoolsProtocols,
} from './tgMessageHandlers/handleStakeInPool.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = 8080;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Add an endpoint to recieve id token from Google OAuth
app.post('/api/oauth-verify', async (req, res) => {
  try {
    const { chatId, token } = req.body;
    const decodedToken = await decodeToken(token);

    console.log(decodedToken, chatId);
    const { sub } = decodedToken;

    // Sub will serve as the user salt for zkLogin. This will ensure that user salt never changes for a user.
    const userAddress = await getUserAddress(token, BigInt(sub));

    await bot.sendMessage(
      chatId,
      `zkLogin successful! Your address is ${userAddress}. Getting the zero-knowledge proof now!`,
    );

    await getZeroKnowledgeProof(chatId);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error' + error.message);
  }
});

bot.getMe().then((me) => {
  console.log('Hi my name is %s!', me.username);
});

bot.onText(/\/start/, async (msg) => {
  console.log('here');
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;

  console.log(chatId, firstName);

  await bot.sendMessage(
    chatId,
    `Hello ${firstName}! Welcome to Suimate DeFi Helper Bot!. Use this bot to do anything across any DeFi platform on Sui without going through their shit UX 😜`,
  );

  await handleStart(chatId);
});

bot.on('callback_query', async (query) => {
  const callbackData = query.data;
  const chatId = query.message.chat.id;

  if (callbackData === 'start_zklogin_onboarding') {
    const oauthUrl = await generateGoogleOauthUrl(chatId);
    await bot.sendMessage(
      chatId,
      `Click on the link to start the onboarding process.\n\n${oauthUrl}`,
    );
  }

  if (callbackData === 'start_pk_onboarding') {
    await bot.sendMessage(
      chatId,
      `Enter a password to protect your private key. The password will be used to encrypt your private key. Make sure to remember the password.`,
    );

    await bot.sendMessage(chatId, `Enter the password`, {
      reply_markup: {
        force_reply: true,
      },
    });
  }

  if (callbackData === 'view_address') {
    await handleViewAddress(chatId);
  }

  if (callbackData === 'view_private_key') {
    await promptForPassword(chatId, 'view your private key');
  }

  if (callbackData === 'view_balances') {
    await handleViewAccountBalances(chatId);
  }

  if (callbackData === 'perform_swap') {
    await initiateSwap(chatId);
  }

  if (callbackData.startsWith('swap_input_')) {
    const coinSymbol = callbackData.split('_')[2];
    await handleSwapInputCoinSelected(chatId, coinSymbol);
  }

  if (callbackData.startsWith('swap_output_')) {
    const coinSymbol = callbackData.split('_')[2];
    await handleSelectSwapOutputCoin(chatId, coinSymbol);
  }

  if (callbackData === 'swap_confirm') {
    await handleSwapConfirm(chatId);
  }

  if (callbackData.startsWith('confirm_perform_swap_')) {
    const routerId = callbackData.split('_')[3];
    await handleConfirmSwapStart(chatId, routerId);
  }

  if (callbackData === 'view_validators') {
    await handleViewActiveValidators(chatId);
  }

  if (callbackData === 'view_liquidity_pools_protocols') {
    await handleViewPoolsProtocols(chatId);
  }

  if (callbackData.startsWith('view_pools_in_')) {
    const protocolName = callbackData.split('_')[3];
    await handleProtocolNameSelected(chatId, protocolName);
  }

  if (callbackData.startsWith('stake_pool_in_')) {
    const protocolName = callbackData.split('_')[3];
    const poolName = callbackData.split('_')[4];
    await handleValidatorNameSelected(chatId, poolName);
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;
  const username = msg.from.username;

  if (msg.reply_to_message) {
    if (msg.reply_to_message.text === 'Enter the password') {
      const password = msg.text;
      await handleOnboardUsingPrivateKey(chatId, password, name, username);
    }

    if (
      msg.reply_to_message.text ===
      'Please enter your password to view your private key'
    ) {
      const password = msg.text;
      await handleViewPrivateKey(chatId, password);
    }

    if (msg.reply_to_message.text === 'Enter the coin name or symbol') {
      const searchQuery = msg.text;
      await handleSearchForSwapOutputCoin(chatId, searchQuery);
    }

    if (
      msg.reply_to_message.text.includes('Enter the amount of') &&
      msg.reply_to_message.text.includes('you want to swap for')
    ) {
      const inputAmount = msg.text;
      await handleSwapAmountEntered(chatId, inputAmount);
    }

    if (msg.reply_to_message.text === 'Please enter your password to swap') {
      const password = msg.text;
      await handlePasswordEnteredForSwap(chatId, password);
    }

    if (
      msg.reply_to_message.text === 'Enter the name of the validator to stake'
    ) {
      const validatorName = msg.text;
      await handleValidatorNameSelected(chatId, validatorName);
    }

    if (
      msg.reply_to_message.text.startsWith(
        'Enter the amount of SUI to stake to',
      )
    ) {
      const validatorName = msg.reply_to_message.text
        .split('Enter the amount of SUI to stake to')[1]
        .trim();
      const amount = msg.text;
      await handleStakeAmountEntered(chatId, validatorName, amount);
    }

    if (
      msg.reply_to_message.text === 'Please enter your password to liquid stake'
    ) {
      const password = msg.text;
      await handlePasswordEnteredForLiquidStaking(chatId, password);
    }
  }
});
