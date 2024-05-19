import { Dex, SdkBase } from 'kriya-dex-sdk';
import { SUI_RPC_ENDPOINT } from '../../constants/index.js';

export const kriyaDexClient = new Dex(SUI_RPC_ENDPOINT);
export const kriyaBaseClient = new SdkBase(SUI_RPC_ENDPOINT);
