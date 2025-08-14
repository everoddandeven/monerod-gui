import { AfterContentInit, Component, inject, OnDestroy } from '@angular/core';
import { NavbarPill, NavbarService } from '../../shared/components';
import { Subscription } from 'rxjs';

@Component({
    template: '',
    standalone: false
})
export abstract class BasePageComponent implements AfterContentInit, OnDestroy {
  private navbarService: NavbarService = inject(NavbarService)

  private readonly initializedTables: { [key: string]: JQuery<HTMLElement> | undefined } = {};
  private _links: NavbarPill[] = [];

  public get links(): NavbarPill[] {
    return this.navbarService.links;
  }

  protected subscriptions: Subscription[] = [];

  private readonly mResizeHandler: () => void = () => setTimeout(() => {
    this.updateTablesContentHeight();
  }, 100);

  constructor() {
    this.subscriptions.push(this.navbarService.onDaemonStatusChanged.subscribe((running) => {
      if (running) setTimeout(() => this.updateTablesContentHeight(), 100);
    }));

    window.addEventListener('resize', this.mResizeHandler);
  }

  public updateTablesContentHeight(): void {
    this.updateTableContentHeight('pills-tabContent');
  }

  protected setLinks(links: NavbarPill[] = []): void {
    this._links = links;
  }

  protected initTable(id: string, loading: boolean = false): void {
    if (!document.getElementById(id)) {
      console.warn(`Cannot find table ${id}`);
      return;
    }

    if (this.isTableInitialized(id)) {
      console.warn(`BootstrapTable ${id} already initiliazed`);
      return;
    }

    const $table = $(`#${id}`);

    $table.bootstrapTable({});
    $table.bootstrapTable('refreshOptions', {
      classes: 'table table-bordered table-hover table-dark table-striped'
    });

    if(loading) $table.bootstrapTable('showLoading');

    this.setTableInitialized(id, $table);
  }

  protected setTableLoading(id: string, loading: boolean = true): void {
    if (!this.isTableInitialized(id)) {
      this.initTable(id, loading);
      return;
    }

    const $table = this.initializedTables[id];

    if (!$table) {
      console.warn(`Could not set table loading to ${id}`);
      return;
    }

    $table.bootstrapTable('showLoading');
  }

  protected loadTable(id: string, rows: any[], loading: boolean = false): void {
    if (!this.isTableInitialized(id)) {
      this.initTable(id);
    }

    if (!this.isTableInitialized(id)) {
      console.warn(`Cannot load table ${id}`);
      return;
    }

    const $table = this.initializedTables[id] as JQuery<HTMLElement>;

    $table.bootstrapTable('load', rows);
    if (loading) $table.bootstrapTable('showLoading');
    else $table.bootstrapTable('hideLoading');
  }

  protected destroyTable(id: string): void {
    const $table = this.initializedTables[id];

    if (!$table) {
      console.warn(`Table ${id} is not initialized`);
      return;
    }

    $table.bootstrapTable('destroy');
    
    this.initializedTables[id] = undefined;
  }

  protected destroyTables(): void {
    for(const key in this.initializedTables) {
      this.destroyTable(key);
    }
  }

  private setTableInitialized(id: string, table: JQuery<HTMLElement>): void {
    this.initializedTables[id] = table;
  }

  protected isTableInitialized(id: string): boolean {
    const initalized: JQuery<HTMLElement> | undefined = this.initializedTables[id];

    if (initalized) {
      return true;
    }

    return false;
  }

  protected getTable(id: string): JQuery<HTMLElement> | undefined {
    const initalized: JQuery<HTMLElement> | undefined = this.initializedTables[id];

    return initalized;
  }

  protected getTableSelection<TRow extends { [key: string]: any }>(id: string): TRow[] {
    const table = this.getTable(id);

    if (!table) {
      return [];
    }

    const result = table.bootstrapTable('getSelections') as TRow[];

    if (!result) {
      return [];
    }

    return result;
  }

  protected removeTableSelection<TRow extends { [key: string]: any }>(id: string, key: string): TRow[] {
    const table = this.getTable(id);

    if (!table || key === '') {
      return [];
    }

    const selection = this.getTableSelection<TRow>(id);

    if (selection.length === 0) {
      return [];
    }

    const firstRow = selection[0];

    if (!firstRow[key]) {
      console.warn("Cannote remove selection by key: " + key);
      return [];
    }

    const ids: any[] = [];

    selection.forEach((s) => {
      ids.push(s[key]);
    });

    table.bootstrapTable('remove', {
      field: key,
      values: ids
    });

    return selection;
  }

  public ngAfterContentInit(): void {
    this.navbarService.setLinks(this._links);

    setTimeout(() => this.updateTablesContentHeight(), 100);
  }

  public ngOnDestroy(): void {
    if (this.subscriptions.length == 0) return;

    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.subscriptions = [];
    
    window.removeEventListener('resize', this.mResizeHandler);

    this.destroyTables();
  }

  public getTableContent(id: string): HTMLElement | undefined {

    const element = document.getElementById(id);

    if (!(element instanceof HTMLElement)) {
      return undefined;
    }

    return element;
  }

  public updateTableContentHeight(id: string): void {
    if (!visualViewport) {
      return;
    }

    const viewHeight = visualViewport?.height;

    if (!viewHeight) {
      return;
    }

    const offset = 35;
    const tab = this.getTableContent(id);

    if (!tab) {
      return;
    }

    const rect = tab.getBoundingClientRect();
    const left = viewHeight - rect.bottom;
    const currentHeight = tab.clientHeight;
    let newHeight: number;

    if (left > 0) {
      if (left < offset) {
        newHeight = parseInt(`${currentHeight}`);
      }
      else {
        const offsetLeft = left - offset;
        newHeight = parseInt(`${ currentHeight + offsetLeft }`);
      }
    }
    else {
      newHeight = currentHeight + left - offset;
    }

    tab.style.height = `${newHeight}px`;
  }

  public scrollTableContentToBottom(id: string): void {
    setTimeout(() => {
      const tabContent = this.getTableContent(id);
  
      if (!tabContent) {
        console.warn("Could not find logs tab " + id);
        return;
      }
      
      if (tabContent) {
        tabContent.scrollTo(0, tabContent.scrollHeight);
      }
    }, 100);
  }
}
