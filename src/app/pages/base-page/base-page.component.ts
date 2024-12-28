import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { NavbarLink, NavbarService } from '../../shared/components';
import { Subscription } from 'rxjs';

@Component({
  template: '',
})
export abstract class BasePageComponent implements AfterContentInit, OnDestroy {

  private readonly initializedTables: { [key: string]: JQuery<HTMLElement> | undefined } = {};
  private _links: NavbarLink[] = [];

  public get links(): NavbarLink[] {
    return this.navbarService.links;
  }

  protected subscriptions: Subscription[] = [];

  constructor(private navbarService: NavbarService) { }

  protected setLinks(links: NavbarLink[] = []): void {
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
  }

  public ngOnDestroy(): void {
    if (this.subscriptions.length == 0) return;

    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
    this.subscriptions = [];

    this.destroyTables();
  }
}
