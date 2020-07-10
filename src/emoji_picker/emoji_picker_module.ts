import {BidiModule} from '@angular/cdk/bidi';
import {CdkScrollableModule} from '@angular/cdk/scrolling';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';

import {EmojiPicker} from './emoji_picker';
import {EmojiSection} from './emoji_section';

@NgModule({
  declarations: [EmojiPicker, EmojiSection],
  imports: [
    BidiModule,
    CdkScrollableModule,
    CommonModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
  ],
  providers: [],
  exports: [EmojiPicker],
  entryComponents: [EmojiSection],
})
export class EmojiPickerModule {}
