import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-load',
    imports: [NgIf],
    templateUrl: './load.component.html',
    styleUrl: './load.component.scss'
})
export class LoadComponent {

  @Input() public show: boolean = false;

}
