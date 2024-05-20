import {
  Aftermath,
  type RouterTradeRoute,
  type Router,
  type ExternalFee,
  type RouterTradeCoin,
  type Staking,
} from 'aftermath-ts-sdk';
import {
  MY_ADDRESS,
  SLIPPAGE_TOLERANCE,
  SUI_DECIMALS,
  SWAP_FEE_PERCENT,
} from '../../constants/index.js';
import SuiCoinsList from '../../constants/suiCoinsList.js';
import { toBigNumberFromDecimal, toDecimalString } from '../parseBignum.js';

class AftermathSdk {
  private afSdk: Aftermath;
  private router: Router;
  private staking: Staking;

  constructor() {
    this.afSdk = new Aftermath('MAINNET');
    this.initializeSdk();
  }

  async initializeSdk() {
    await this.afSdk.init();
    this.router = this.afSdk.Router();
    this.staking = this.afSdk.Staking();
  }

  async getSwapRoute(
    coinInSymbol: string,
    coinOutSymbol: string,
    amountIn: string,
    retryCount: number = 0,
  ) {
    try {
      if (retryCount > 5) {
        return null;
      }

      const coinIn = SuiCoinsList.find((coin) => coin.symbol === coinInSymbol);
      const coinOut = SuiCoinsList.find(
        (coin) => coin.symbol === coinOutSymbol,
      );

      const coinInType = coinIn.coinID;
      const coinOutType = coinOut.coinID;

      const route = await this.router.getCompleteTradeRouteGivenAmountIn({
        coinInType,
        coinOutType,
        coinInAmount: BigInt(toBigNumberFromDecimal(amountIn, coinIn.decimals)),
        referrer: MY_ADDRESS,
        externalFee: {
          recipient: MY_ADDRESS,
          feePercentage: SWAP_FEE_PERCENT,
        },
      });

      return {
        ...route,
        outputAmount: toDecimalString(
          route.coinOut.amount.toString(),
          coinOut.decimals,
          2,
        ),
      };
    } catch (error) {
      console.error(error);
      await this.getSwapRoute(
        coinInSymbol,
        coinOutSymbol,
        amountIn,
        retryCount + 1,
      );
    }
  }

  async performSwap(
    walletAddress: string,
    routeData: {
      coinIn: RouterTradeCoin;
      coinOut: RouterTradeCoin;
      spotPrice: number;
      routes: RouterTradeRoute[];
      referrer?: string;
      externalFee?: ExternalFee;
    },
  ) {
    try {
      const tx = await this.router.getTransactionForCompleteTradeRoute({
        walletAddress,
        completeRoute: routeData,
        slippage: SLIPPAGE_TOLERANCE,
      });

      tx.setSender(walletAddress);
      return tx;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getLiquidStakingPositions(walletAddress: string) {
    try {
      const stakingPositions = await this.staking.getStakingPositions({
        walletAddress,
      });

      return stakingPositions;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async performLiquidStaking(
    walletAddress: string,
    validatorAddress: string,
    amount: string,
  ) {
    try {
      const tx = await this.staking.getStakeTransaction({
        walletAddress,
        suiStakeAmount: BigInt(toBigNumberFromDecimal(amount, SUI_DECIMALS)),
        validatorAddress,
      });

      tx.setSender(walletAddress);
      return tx;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async performLiquidUnstaking(walletAddress: string, amount: string) {
    try {
      const tx = await this.staking.getUnstakeTransaction({
        walletAddress,
        afSuiUnstakeAmount: BigInt(
          toBigNumberFromDecimal(amount, SUI_DECIMALS),
        ),
        isAtomic: true,
      });

      tx.setSender(walletAddress);
      return tx;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

const aftermathSdk = new AftermathSdk();
export default aftermathSdk;
