import { Dex, SdkBase } from 'kriya-dex-sdk';
import { SUI_RPC_ENDPOINT } from '../../constants/index.js';
import kriyaPools from './poolsList.js';

class KriyaSdk {
  private kriyaDexClient: Dex;
  private kriyaBaseClient: SdkBase;

  constructor() {
    this.kriyaDexClient = new Dex(SUI_RPC_ENDPOINT);
    this.kriyaBaseClient = new SdkBase(SUI_RPC_ENDPOINT);
  }

  getAllPools = async () => {
    return kriyaPools;
  };
}

const kriyaSdk = new KriyaSdk();
export default kriyaSdk;
