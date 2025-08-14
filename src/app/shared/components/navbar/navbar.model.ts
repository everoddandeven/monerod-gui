

export class NavbarPill {
  public id: string;
  public target: string;
  public controls: string;
  public selected: boolean;
  public name: string;
  public disabled: boolean;
  public disableIfNotRunning: boolean;

  constructor(id: string, name: string, selected: boolean = false, disabled: boolean = true, disableIfNotRunning: boolean = true) {
    this.id = `pills-${id}-tab`;
    this.target = `#pills-${id}`;
    this.controls = id;
    this.selected = selected;
    this.name = name;
    this.disabled = disabled;
    this.disableIfNotRunning = disableIfNotRunning;
  }

}