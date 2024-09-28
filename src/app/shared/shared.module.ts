import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent, SidebarComponent, DaemonNotRunningComponent, DaemonStoppingComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@NgModule({
  declarations: [PageNotFoundComponent, SidebarComponent, DaemonNotRunningComponent, DaemonStoppingComponent, NavbarComponent, WebviewDirective],
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, SidebarComponent, DaemonNotRunningComponent, DaemonStoppingComponent, NavbarComponent]
})
export class SharedModule {}
