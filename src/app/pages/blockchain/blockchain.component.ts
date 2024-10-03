import { AfterViewInit, Component, NgZone } from '@angular/core';
import { NavbarLink } from '../../shared/components/navbar/navbar.model';
import { DaemonService } from '../../core/services/daemon/daemon.service';
import { Block, BlockHeader } from '../../../common';

@Component({
  selector: 'app-blockchain',
  templateUrl: './blockchain.component.html',
  styleUrl: './blockchain.component.scss'
})
export class BlockchainComponent implements AfterViewInit {
  public readonly navbarLinks: NavbarLink[];
  public daemonRunning: boolean = false;
  public lastBlockHeader?: BlockHeader;
  public getLastBlockError: string = '';
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

  constructor(private daemonService: DaemonService, private ngZone: NgZone) {
    this.navbarLinks = [
      new NavbarLink('pills-last-block-header-tab', '#pills-last-block-header', 'pills-last-block-header', true, 'Last Block Header'),
      new NavbarLink('pills-get-block-tab', '#pills-get-block', 'pills-get-block', false, 'Get Block'),
      new NavbarLink('pills-get-block-header-tab', '#pills-get-block-header', 'pills-get-block-header', false, 'Get Block Header'),
      new NavbarLink('pills-pop-blocks-tab', '#pills-pop-blocks', 'pills-pop-blocks', false, 'Pop Blocks'),
      new NavbarLink('pills-prune-blockchain-tab', '#pills-prune-blockchain', 'pills-prune-blockchain', false, 'Prune'),
      new NavbarLink('pills-save-bc-tab', '#pills-save-bc', 'pills-save-bc', false, 'Save')
    ];

    this.daemonService.onDaemonStatusChanged.subscribe((running) => {
      this.ngZone.run(() => {
        this.daemonRunning = running;
        this.navbarLinks.forEach((link) => link.disabled = !running);
      });
    });

    this.daemonService.isRunning().then((value: boolean) => {
      this.ngZone.run(() => {
        this.daemonRunning = value;
        this.navbarLinks.forEach((link) => link.disabled = !value);
      });
    });
  }

  ngAfterViewInit(): void {
      this.load();
  }

  public async load(): Promise<void> {
    await this.getLastBlockHeader();
  }

  private async getLastBlockHeader(): Promise<void> {
    this.gettingLastBlock = true;
    try {
      this.lastBlockHeader = await this.daemonService.getLastBlockHeader(true);
      this.getLastBlockError = '';
    }
    catch(error) {
      console.error(error);
      this.getLastBlockError = `${error}`;
    }
    this.gettingLastBlock = false;
  }

  public async getBlock(): Promise<void> {
    this.gettingLastBlock = true;
    try {
      this.block = await this.daemonService.getBlock(this.getBlockByHash ? this.getBlockHash : this.getBlockHeight, this.fillPoWHash);
      this.getBlockError = '';
    }
    catch(error) {
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
    } catch (error) {
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
    catch(error) {
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
    catch(error) {
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
    } catch(error) {
      this.pruneBlockchainError = `${error}`;
      this.blockchainPruned = false;
    }

    this.pruningBlockchain = false;
  }
}
