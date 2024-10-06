export type LogCategoryLevel = '' | 'TRACE' | 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';

export class LogCategories {
  all: LogCategoryLevel = 'WARNING';
  default: LogCategoryLevel = '';

  net: LogCategoryLevel = 'FATAL';
  netHttp: LogCategoryLevel = '';
  netP2p: LogCategoryLevel = 'FATAL';
  netThrottle: LogCategoryLevel = ''
  netDns: LogCategoryLevel = '';
  netDl: LogCategoryLevel = '';
  netCn: LogCategoryLevel = 'FATAL';

  blockchain: LogCategoryLevel = '';
  blockchainDb: LogCategoryLevel = '';
  blockchainDbLmdb: LogCategoryLevel = '';

  bcutil: LogCategoryLevel = '';
  checkpoints: LogCategoryLevel = '';

  i18n: LogCategoryLevel = '';
  perf: LogCategoryLevel = '';
  stacktrace: LogCategoryLevel = 'INFO';
  updates: LogCategoryLevel = '';
  account: LogCategoryLevel = '';
  
  cn: LogCategoryLevel = '';
  cnBlockQueue: LogCategoryLevel = '';

  difficulty: LogCategoryLevel = '';
  hardfork: LogCategoryLevel = '';
  miner: LogCategoryLevel = '';
  txpool: LogCategoryLevel = '';

  daemon: LogCategoryLevel = '';
  daemonRpc: LogCategoryLevel = '';

  debugToolsDeserialize: LogCategoryLevel = '';
  debugToolsObjectSizes: LogCategoryLevel = '';

  deviceLedger: LogCategoryLevel = '';

  walletGenMultisig: LogCategoryLevel = '';
  walletSimpleWallet: LogCategoryLevel = '';
  walletAPI: LogCategoryLevel = '';
  walletRingDb: LogCategoryLevel = '';
  walletWallet2: LogCategoryLevel = '';
  walletRpc: LogCategoryLevel = '';

  testsCore: LogCategoryLevel = '';

  multisig: LogCategoryLevel = '';
  bulletproofs: LogCategoryLevel = '';
  ringct: LogCategoryLevel = '';

  logging: LogCategoryLevel = 'INFO';
  global: LogCategoryLevel = 'INFO';
  verify: LogCategoryLevel = 'FATAL';

  msgwriter: LogCategoryLevel = 'INFO';

  public toString(): string {
    const values: string[] = [];

    if (this.all != '') {
      values.push(`*:${this.all}`);
    }

    if (this.default != '') {
      values.push(`default:${this.default}`);
    }

    if (this.net != '') {
      values.push(`net:${this.net}`);
    }

    if (this.netHttp != '') {
      values.push(`net.http:${this.netHttp}`);
    }

    if (this.netP2p != '') {
      values.push(`net.p2p:${this.netP2p}`);
    }

    if (this.netThrottle != '') {
      values.push(`net.throttle:${this.netThrottle}`);
    }

    if (this.netDns != '') {
      values.push(`net.dns:${this.netDns}`);
    }
    
    if (this.netDl != '') {
      values.push(`net.dl:${this.netDl}`);
    }

    if (this.netCn != '') {
      values.push(`net.cn:${this.netCn}`);
    }

    if (this.blockchain != '') {
      values.push(`blockchain:${this.blockchain}`);
    }

    if (this.blockchainDb != '') {
      values.push(`blockchain.db:${this.blockchainDb}`);
    }
    
    if (this.blockchainDbLmdb != '') {
      values.push(`blockchain.db.lmdb:${this.blockchainDbLmdb}`);
    }
    
    if (this.bcutil != '') {
      values.push(`bcutil:${this.bcutil}`);
    }
        
    if (this.checkpoints != '') {
      values.push(`checkpoints:${this.checkpoints}`);
    }

    if (this.i18n != '') {
      values.push(`i18n:${this.i18n}`);
    }
 
    if (this.perf != '') {
      values.push(`perf:${this.perf}`);
    }
        
    if (this.stacktrace != '') {
      values.push(`stacktrace:${this.stacktrace}`);
    }
        
    if (this.updates != '') {
      values.push(`updates:${this.updates}`);
    }
            
    if (this.account != '') {
      values.push(`account:${this.account}`);
    }
                
    if (this.cn != '') {
      values.push(`cn:${this.cn}`);
    }
                    
    if (this.cnBlockQueue != '') {
      values.push(`cn.block_queue:${this.cnBlockQueue}`);
    }
                        
    if (this.difficulty != '') {
      values.push(`difficulty:${this.difficulty}`);
    }
                            
    if (this.hardfork != '') {
      values.push(`hardfork:${this.hardfork}`);
    }
                     
    if (this.miner != '') {
      values.push(`miner:${this.miner}`);
    }
                     
    if (this.txpool != '') {
      values.push(`txpool:${this.txpool}`);
    }
                    
    if (this.daemon != '') {
      values.push(`daemon:${this.daemon}`);
    }
                         
    if (this.daemonRpc != '') {
      values.push(`daemon.rpc:${this.daemonRpc}`);
    }

    if (this.debugToolsDeserialize != '') {
      values.push(`debugtools.deserialize:${this.debugToolsDeserialize}`);
    }
                        
    if (this.debugToolsObjectSizes != '') {
      values.push(`debugtools.objectsizes:${this.debugToolsObjectSizes}`);
    }
                             
    if (this.deviceLedger != '') {
      values.push(`device.ledger:${this.deviceLedger}`);
    }

    if (this.walletGenMultisig != '') {
      values.push(`wallet.gen_multisig:${this.walletGenMultisig}`);
    }
                         
    if (this.walletSimpleWallet != '') {
      values.push(`wallet.simplewallet:${this.walletSimpleWallet}`);
    }
                         
    if (this.walletAPI != '') {
      values.push(`WalletAPI:${this.walletAPI}`);
    }
                         
    if (this.walletRingDb != '') {
      values.push(`wallet.ringdb:${this.walletRingDb}`);
    }
                         
    if (this.walletWallet2 != '') {
      values.push(`wallet.wallet2:${this.walletWallet2}`);
    }

    if (this.walletRpc != '') {
      values.push(`wallet.rpc:${this.walletRpc}`);
    }
                                       
    if (this.testsCore != '') {
      values.push(`tests.core:${this.testsCore}`);
    }
                         
    if (this.multisig != '') {
      values.push(`multisig:${this.multisig}`);
    }
                         
    if (this.bulletproofs != '') {
      values.push(`bulletproofs:${this.bulletproofs}`);
    }
                         
    if (this.ringct != '') {
      values.push(`ringct:${this.ringct}`);
    }
                         
    if (this.logging != '') {
      values.push(`logging:${this.logging}`);
    }
                         
    if (this.global != '') {
      values.push(`global:${this.global}`);
    }
                         
    if (this.verify != '') {
      values.push(`verify:${this.verify}`);
    }
                         
    if (this.msgwriter != '') {
      values.push(`msgwriter:${this.msgwriter}`);
    }

    return values.join(',');
  }

  public equals(categories: LogCategories): boolean {
    return this.toString() == categories.toString();
  }
}
