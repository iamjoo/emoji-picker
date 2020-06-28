import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';

import {AppComponent} from './app.component';

import {EmojiPickerModule} from '../emoji_picker/emoji_picker_module';
import {MessageEntryModule} from '../message_entry/message_entry_module';
import {MessagesViewModule} from '../messages_view/messages_view_module';
import {MESSAGES_STORAGE_KEY} from '../storage_key/storage_key';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    EmojiPickerModule,
    MatButtonModule,
    MessageEntryModule,
    MessagesViewModule,
  ],
  providers: [{provide: MESSAGES_STORAGE_KEY, useValue: 'messages_key'}],
  bootstrap: [AppComponent]
})
export class AppModule {}
