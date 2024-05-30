import BigNumber from 'bignumber.js';
import { SUI_DECIMALS } from '../constants/index.js';

export const toDecimalValue = (balance: number, decimals: number) => {
  // if (balance < 0) return NaN;
  return balance / 10 ** decimals;
};

export const toDecimalBigNumberValue = (balance: string, decimals: number) => {
  const bnDecimals = BigNumber(10).exponentiatedBy(decimals);
  return BigNumber(balance).dividedBy(bnDecimals).toNumber();
};

export const toDecimalString = (
  balance: string | number,
  decimals = SUI_DECIMALS,
  precision = 2,
) => {
  try {
    if (!balance) return 0;
    // if (balance < 0) return NaN;

    // Regex to separate number strings from hexadecimal strings (parseFloat cannot do this)
    // Regex is simply all the characters in the string should be numbers, else return NaN
    // if (!/^\d+$/.test(balance)) return NaN;

    // Return the final value
    return toDecimalBigNumberValue(BigNumber(balance), decimals).toLocaleString(
      'en-US',
      {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision,
      },
    );
  } catch (error) {
    return 0;
  }
};

export const toBigNumberFromDecimal = (balance: string, decimals: number) => {
  return BigNumber(balance)
    .multipliedBy(10 ** decimals)
    .toString();
};

export const convertToInternationalCurrencySystem = (amount: number) => {
  try {
    const language = 'en';
    // eslint-disable-next-line
    return Intl.NumberFormat(language, {
      notation: 'compact',
      maximumFractionDigits: 3,
    }).format(amount);
  } catch (err) {
    return amount;
  }
};
