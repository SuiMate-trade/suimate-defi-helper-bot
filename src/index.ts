import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import {
  decodeToken,
  generateGoogleOauthUrl,
  getUserAddress,
  getZeroKnowledgeProof,
} from './helpers/handleZkLogin.js';
import { verifyIfNewUser } from './helpers/verifyIfNewUser.js';
import bot from './utils/bot.js';
import { createNewAccount } from './helpers/handlePrivateKeyOnboarding.js';

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
  const userName = msg.from.username;

  console.log(chatId, firstName);

  await bot.sendMessage(
    chatId,
    `Hello ${firstName}! Welcome to Suimate DeFi Helper Bot!. Use this bot to do anything across any DeFi platform on Sui without going through their shit UX 😜`,
  );

  const isNewUser = await verifyIfNewUser(`${chatId}-${userName}`);
  if (isNewUser) {
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
  }
});

bot.on('callback_query', async (query) => {
  const callbackData = query.data;

  if (callbackData === 'start_zklogin_onboarding') {
    const oauthUrl = await generateGoogleOauthUrl(query.message.chat.id);
    await bot.sendMessage(
      query.message.chat.id,
      `Click on the link to start the onboarding process.\n\n${oauthUrl}`,
    );
  }

  if (callbackData === 'start_pk_onboarding') {
    await bot.sendMessage(
      query.message.chat.id,
      `Enter a password to protect your private key. The password will be used to encrypt your private key. Make sure to remember the password.`,
    );

    await bot.sendMessage(query.message.chat.id, `Enter the password`, {
      reply_markup: {
        force_reply: true,
      },
    });
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.reply_to_message) {
    if (msg.reply_to_message.text === 'Enter the password') {
      const password = msg.text;
      await bot.sendMessage(
        chatId,
        `Creating a new account for you. Please wait...`,
      );

      const { address, publicKey, secretKey } = await createNewAccount(
        password,
        chatId,
      );

      await bot.sendMessage(
        chatId,
        `Your account has been created successfully! \n\nAddress: ${address}\nPublic Key: ${publicKey}\nPrivate Key: ${secretKey} \n\n Your private key has been encrypted with the password you provided. Make sure to remember the password to make transactions from the bot.`,
      );
    }
  }
});
