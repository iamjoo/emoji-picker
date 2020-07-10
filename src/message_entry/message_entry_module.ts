import {ObserversModule} from '@angular/cdk/observers';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

import {MessageEntry} from './message_entry';

@NgModule({
  declarations: [MessageEntry],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    ObserversModule,
  ],
  providers: [],
  exports: [MessageEntry],
})
export class MessageEntryModule {}
