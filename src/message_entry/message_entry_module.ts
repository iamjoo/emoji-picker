import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

import {MessageEntry} from './message_entry';

@NgModule({
  declarations: [MessageEntry],
  imports: [MatButtonModule, MatIconModule],
  providers: [],
  exports: [MessageEntry],
})
export class MessageEntryModule {}
