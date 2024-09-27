import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent, SidebarComponent, DaemonNotRunningComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [PageNotFoundComponent, SidebarComponent, DaemonNotRunningComponent, WebviewDirective],
  imports: [CommonModule, TranslateModule, FormsModule, RouterModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, SidebarComponent, DaemonNotRunningComponent]
})
export class SharedModule {}
