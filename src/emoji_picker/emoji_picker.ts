import {Component} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

const EMOJIS_PER_CATEGORY = 20;

@Component({
  selector: 'emoji-picker',
  templateUrl: './emoji_picker.ng.html',
  styleUrls: ['./emoji_picker.scss'],
})
export class EmojiPicker {
  readonly selectedCategory$ = new BehaviorSubject<string>('smileys');

  categorySelected(category: string): void {
    this.selectedCategory$.next(category);
  }

  selectEmoji(): void {
    console.log('emooji selected');
  }
}
