import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import {
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
} from '@mysten/zklogin';
import { jwtToAddress } from '@mysten/zklogin';

import {
  ENOKI_API_KEY,
  ENOKI_API_URL,
  GOOGLE_OAUTH_CLIENT_ID,
  REDIRECT_URL,
} from '../constants/index.js';
import client from '../utils/sui.js';
import { db } from '../utils/firebase.js';
import axios from 'axios';

export const generateKeypairAndNonce = async (chatId: number) => {
  try {
    const { epoch, epochDurationMs, epochStartTimestampMs } =
      await client.getLatestSuiSystemState();

    const maxEpoch = Number(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
    const ephemeralKeyPair = new Ed25519Keypair();
    const randomness = generateRandomness();
    const nonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness,
    );

    // Save the nonce and ephemeral key pair in a database with the chatId as the key.
    // This will be used to verify the nonce and ephemeral key pair when the user returns from Google OAuth.
    await db.collection('users').doc(chatId.toString()).set({
      nonce,
      publicKey: ephemeralKeyPair.getPublicKey().toBase64(),
      secretKey: ephemeralKeyPair.getSecretKey(),
      onboardingState: 'googleOauthUrl',
      maxEpoch,
      randomness,
    });

    return {
      ephemeralKeyPair,
      nonce,
      randomness,
      epochDurationMs,
      epochStartTimestampMs,
      maxEpoch,
    };
  } catch (error) {
    console.error(error);
    throw new Error('Error generating keypair and nonce');
  }
};

export const generateGoogleOauthUrl = async (chatId: number) => {
  try {
    const { nonce } = await generateKeypairAndNonce(chatId);

    const state = chatId;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_OAUTH_CLIENT_ID}&response_type=id_token&redirect_uri=${REDIRECT_URL}&scope=openid&state=${state}&nonce=${nonce}`;
    return oauthUrl;
  } catch (error) {
    console.error(error);
    return '';
  }
};

export const decodeToken = async (idToken: string) => {
  try {
    const decodedJwt = jwtDecode(idToken);
    return decodedJwt as JwtPayload;
  } catch (error) {
    console.error(error);
    throw new Error('Error decoding token');
  }
};

export const getUserAddress = async (jwt: string, userSalt: bigint) => {
  try {
    const zkLoginUserAddress = jwtToAddress(jwt, userSalt);
    return zkLoginUserAddress;
  } catch (error) {
    console.error(error);
    throw new Error('Error getting user address');
  }
};

export const getZeroKnowledgeProof = async (chatId: number) => {
  try {
    const userDoc = await db.collection('users').doc(chatId.toString()).get();
    const { publicKey, secretKey, maxEpoch, randomness } = userDoc.data();

    const ephemeralKeyPair = new Ed25519Keypair({
      publicKey: new Uint8Array(Buffer.from(publicKey, 'base64')),
      secretKey,
    });

    console.log(ephemeralKeyPair.getPublicKey().toBase64());

    const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
      ephemeralKeyPair.getPublicKey(),
    );

    const zkpResponse = await axios.post(
      `${ENOKI_API_URL}?network=testnet&randomness=${randomness}&max_epoch=${maxEpoch}&ephemeralPublicKey=${extendedEphemeralPublicKey}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${ENOKI_API_KEY}`,
        },
      },
    );

    console.log(zkpResponse.data);
  } catch (error) {
    console.error(error.response);
    throw new Error('Error getting zero knowledge proof');
  }
};
