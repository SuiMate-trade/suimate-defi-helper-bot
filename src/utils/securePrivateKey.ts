import crypto from 'crypto-js';

const keySize = 256;
const ivSize = 128;
const saltSize = 128;
const iterations = 1000;

const safeJsonParser = (data: string) => {
  try {
    return JSON.parse(data);
  } catch (err) {
    throw new Error('Invalid JSON string');
  }
};

const deriveEncryptionKey = (
  signature: string,
  salt: crypto.lib.WordArray,
  iterations: number,
) => {
  const res = crypto.PBKDF2(signature, salt, {
    keySize: keySize / 32,
    iterations,
    hasher: crypto.algo.SHA256,
  });

  return res;
};

export const encryptPrivateKey = (privateKey: string, password: string) => {
  const plainText = JSON.stringify({ privateKey });
  const salt = crypto.lib.WordArray.random(saltSize / 8);
  const key = deriveEncryptionKey(password, salt, iterations);

  const iv = crypto.lib.WordArray.random(ivSize / 8);

  const encrypted = crypto.AES.encrypt(plainText, key, {
    iv: iv,
    padding: crypto.pad.Pkcs7,
    mode: crypto.mode.CBC,
  });

  // salt, iv will be hex 32 in length
  // append them to the ciphertext for use  in decryption
  const encryptedMessage =
    salt.toString() + iv.toString() + encrypted.toString();
  return encryptedMessage;
};

export const decryptPrivateKey = (
  password: string,
  encryptedMessage: string,
) => {
  const salt = crypto.enc.Hex.parse(encryptedMessage.substr(0, 32));
  const iv = crypto.enc.Hex.parse(encryptedMessage.substr(32, 32));
  const encrypted = encryptedMessage.substring(64);

  const key = deriveEncryptionKey(password, salt, iterations);

  const decrypted = crypto.AES.decrypt(encrypted, key, {
    iv: iv,
    padding: crypto.pad.Pkcs7,
    mode: crypto.mode.CBC,
  });

  const decryptedString = decrypted.toString(crypto.enc.Utf8);
  const { privateKey } = safeJsonParser(decryptedString);
  return privateKey;
};
