

export class NavbarLink {
    public id: string;
    public target: string;
    public controls: string;
    public selected: boolean;
    public name: string;

    constructor(id: string, target: string, controls: string, selected: boolean, name: string) {
        this.id = id;
        this.target = target;
        this.controls = controls;
        this.selected = selected;
        this.name = name;
    }

}