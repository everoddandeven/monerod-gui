import { Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { Block, BlockHeader } from '../../../common';
import { DaemonDataService } from '../../core/services';
import { NavbarService } from '../../shared/components/navbar/navbar.service';
import { BasePageComponent } from '../base-page/base-page.component';

@Component({
  selector: 'app-blockchain',
  templateUrl: './blockchain.component.html',
  styleUrl: './blockchain.component.scss'
})
export class BlockchainComponent extends BasePageComponent {
  
  public get daemonRunning(): boolean {
    return this.daemonData.running;
  }

  public get daemonStopping(): boolean {
    return this.daemonData.stopping;
  }

  public get daemonStarting(): boolean {
    return this.daemonService.starting;
  }

  public get lastBlockHeader(): BlockHeader | undefined {
    return this.daemonData.lastBlockHeader;
  }

  public get daemonSynchronized(): boolean {
    return this.daemonData.info ? this.daemonData.info.synchronized : false;
  }

  public get getLastBlockError(): string {
    return this.daemonSynchronized ? '' : 'Last block header not available, blockchain is not synchronized';
  }
  
  public block?: Block;
  public getBlockByHash: boolean = false;
  public getBlockHash: string = '';
  public getBlockHeight: number = 0;
  public fillPoWHash: boolean = false;
  public gettingLastBlock: boolean = false;

  public gettingBlock: boolean = false;
  public blockHeader?: BlockHeader;
  public getBlockHeaderByHash: boolean = false;
  public getBlockHeaderHash: string = '';
  public getBlockHeaderHeight: number = 0;

  public getBlockHeaderError: string = '';
  public getBlockError: string = '';
  public gettingBlockHeader: boolean = false;

  public popBlocksNBlocks: number = 0;
  public poppingBlocks: boolean = false;
  public popBlocksError: string = '';
  public popBlocksResult?: number;

  public savingBlockchain: boolean = false;
  public saveBlockchainError: string = '';
  public blockchainSaved: boolean = false;

  public pruningBlockchain: boolean = false;
  public pruneBlockchainError: string = '';
  public blockchainPruned: boolean = false;

  constructor(private daemonService: DaemonService, private daemonData: DaemonDataService, navbarService: NavbarService, private ngZone: NgZone) {
    super(navbarService);
    this.setLinks([
      new NavbarLink('pills-last-block-header-tab', '#pills-last-block-header', 'pills-last-block-header', false, 'Last Block Header'),
      new NavbarLink('pills-get-block-tab', '#pills-get-block', 'pills-get-block', false, 'Get Block'),
      new NavbarLink('pills-get-block-header-tab', '#pills-get-block-header', 'pills-get-block-header', false, 'Get Block Header'),
      new NavbarLink('pills-pop-blocks-tab', '#pills-pop-blocks', 'pills-pop-blocks', false, 'Pop Blocks'),
      new NavbarLink('pills-prune-blockchain-tab', '#pills-prune-blockchain', 'pills-prune-blockchain', false, 'Prune'),
      new NavbarLink('pills-save-bc-tab', '#pills-save-bc', 'pills-save-bc', false, 'Save')
    ]);
  }

  public async getBlock(): Promise<void> {
    this.gettingLastBlock = true;
    try {
      this.block = await this.daemonService.getBlock(this.getBlockByHash ? this.getBlockHash : this.getBlockHeight, this.fillPoWHash);
      this.getBlockError = '';
    }
    catch(error: any) {
      console.error(error);
      this.getBlockError = `${error}`;
    }

    this.gettingLastBlock = false;

  }

  public async getBlockHeader(): Promise<void> {
    this.gettingBlockHeader = true;

    try {
      if (this.getBlockHeaderByHash) {
        this.blockHeader = await this.daemonService.getBlockHeaderByHash(this.getBlockHeaderHash, this.fillPoWHash);
      }
      else {
        this.blockHeader = await this.daemonService.getBlockHeaderByHeight(this.getBlockHeaderHeight, this.fillPoWHash);
      }
      
      this.getBlockHeaderError = '';
    } catch (error: any) {
      console.error(error);
      this.getBlockHeaderError = `${error}`;
    }

    this.gettingBlockHeader = false;
  }

  public async popBlocks(): Promise<void> {
    this.poppingBlocks = true;
    try {
      this.popBlocksResult = await this.daemonService.popBlocks(this.popBlocksNBlocks);
      this.popBlocksError = '';
    }
    catch(error: any) {
      console.error(error);
      this.popBlocksResult = undefined;
      this.popBlocksError = `${error}`;
    }
    this.poppingBlocks = false;
  }

  public async saveBlockchain(): Promise<void> {
    this.savingBlockchain = true;

    try {
      await this.daemonService.saveBc();
      this.blockchainSaved = true;
    }
    catch(error: any) {
      console.error(error);
      this.blockchainSaved = false;
      this.saveBlockchainError = `${error}`;
    }

    this.savingBlockchain = false;
  }

  public async pruneBlockchain(): Promise<void> {
    this.pruningBlockchain = true;

    try {
      await this.daemonService.pruneBlockchain(false);
      this.blockchainPruned = true;
    } catch(error: any) {
      this.pruneBlockchainError = `${error}`;
      this.blockchainPruned = false;
    }

    this.pruningBlockchain = false;
  }
}
