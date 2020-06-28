import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {MessagesView} from './messages_view';

@NgModule({
  declarations: [MessagesView],
  imports: [CommonModule],
  providers: [],
  exports: [MessagesView],
})
export class MessagesViewModule {}
