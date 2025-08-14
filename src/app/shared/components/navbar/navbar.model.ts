

export class NavbarPill {
  public id: string;
  public target: string;
  public controls: string;
  public selected: boolean;
  public name: string;
  public disabled: boolean;
  public disableIfNotRunning: boolean;

  constructor(id: string, target: string, controls: string, selected: boolean, name: string, disabled: boolean = true, disableIfNotRunning: boolean = true) {
    this.id = id;
    this.target = target;
    this.controls = controls;
    this.selected = selected;
    this.name = name;
    this.disabled = disabled;
    this.disableIfNotRunning = disableIfNotRunning;
  }

}