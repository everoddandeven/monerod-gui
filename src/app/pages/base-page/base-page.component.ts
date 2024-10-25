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
    return this._links;
  }

  protected subscriptions: Subscription[] = [];

  constructor(private navbarService: NavbarService) {
     
  }

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

  protected loadTable(id: string, rows: any[]): void {
    if (!this.isTableInitialized(id)) {
      this.initTable(id);
    }

    if (!this.isTableInitialized(id)) {
      console.warn(`Cannot load table ${id}`);
      return;
    }

    const $table = this.initializedTables[id] as JQuery<HTMLElement>;

    $table.bootstrapTable('load', rows);
    $table.bootstrapTable('hideLoading');
  }

  private destroyTable(id: string): void {
    const $table = this.initializedTables[id];

    if (!$table) {
      console.warn(`Table ${id} is not initialized`);
      return;
    }

    $table.bootstrapTable('destroy');
    
    this.initializedTables[id] = undefined;
  }

  private destroyTables(): void {
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
