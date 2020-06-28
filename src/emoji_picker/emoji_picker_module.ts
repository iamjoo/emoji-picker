import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';

import {EmojiPicker} from './emoji_picker';

@NgModule({
  declarations: [EmojiPicker],
  imports: [CommonModule, MatButtonModule, MatDividerModule, MatIconModule],
  providers: [],
  exports: [EmojiPicker],
})
export class EmojiPickerModule {}
