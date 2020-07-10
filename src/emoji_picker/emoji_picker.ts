import {AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, Output, QueryList, ViewChildren} from '@angular/core';

import {ReplaySubject, Subject} from 'rxjs';
import {map, pairwise, startWith, takeUntil, withLatestFrom} from 'rxjs/operators';

import {Direction, EmojiSection} from './emoji_section';

const ORDERED_CATEGORIES = ['smileys', 'animals', 'food', 'sports'];

@Component({
  selector: 'emoji-picker',
  templateUrl: './emoji_picker.ng.html',
  styleUrls: ['./emoji_picker.scss'],
})
export class EmojiPicker implements AfterViewInit, OnDestroy, OnInit {
  readonly direction = Direction;
  readonly selectedCategory$ = new ReplaySubject<string>(1);

  private readonly changeHighlightedEmoji$ = new ReplaySubject<Direction>(1);
  private readonly selectHighlightedEmoji$ = new Subject<void>();
  private readonly tabKey$ = new Subject<boolean>();
  private readonly destroy$ = new ReplaySubject<void>(1);

  @ViewChildren(EmojiSection) emojiSections!: QueryList<EmojiSection>;

  ngOnInit(): void {
    this.selectCategory('smileys');
  }

  ngAfterViewInit(): void {
    this.setupChangeCategory();
    this.setupChangeHighlightedEmoji();
    this.setupSelectHighlightedEmoji();
    this.setupTabKeySwitchCategory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeHighlightedEmoji(direction: Direction): void {
    this.changeHighlightedEmoji$.next(direction);
  }

  emojiSelected(glyph: string): void {
    console.log(`${glyph} selected`);
  }

  getSelectedEmojiSection(category: string): EmojiSection {
    return this.emojiSections.find((emojiSection) => {
      return emojiSection.categoryHeader.toUpperCase() ===
          category.toUpperCase();
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory$.next(category);
  }

  selectHighlightedEmoji(): void {
    this.selectHighlightedEmoji$.next();
  }

  tabSwitchCategory(event: KeyboardEvent) {
    console.log(event);
    event.preventDefault();
    event.stopPropagation();
    this.tabKey$.next(event.shiftKey);
  }

  private setupChangeCategory(): void {
    this.selectedCategory$.pipe(
        startWith(undefined),
        pairwise(),
        takeUntil(this.destroy$),
        ).subscribe(([prevCategory, currCategory]) => {
          if (prevCategory) {
            this.getSelectedEmojiSection(prevCategory).deselectCategory();
          }
          document.getElementById(`${currCategory}-section`)
              .scrollIntoView({behavior: 'smooth'});
          this.getSelectedEmojiSection(currCategory).selectCategory();
        });
  }

  private setupChangeHighlightedEmoji(): void {
    this.changeHighlightedEmoji$.pipe(
        withLatestFrom(this.selectedCategory$),
        takeUntil(this.destroy$),
        ).subscribe(([direction, selectedCategory]) => {
          this.getSelectedEmojiSection(selectedCategory)
              .moveHighlightedEmoji(direction);
        });
  }

  private setupSelectHighlightedEmoji(): void {
    this.selectHighlightedEmoji$.pipe(
        withLatestFrom(this.selectedCategory$),
        takeUntil(this.destroy$),
        ).subscribe(([, category]) => {
          this.getSelectedEmojiSection(category).selectHighlightedEmoji();
        });
  }

  private setupTabKeySwitchCategory(): void {
    this.tabKey$.pipe(
        withLatestFrom(this.selectedCategory$),
        takeUntil(this.destroy$),
        ).subscribe(([shiftKeyPressed, currentCategory]) => {
          const currIndex = ORDERED_CATEGORIES.indexOf(currentCategory);
          if (currIndex < 0) {
            return;
          }

          if (!shiftKeyPressed) {
            const newIndex = (currIndex + 1) % ORDERED_CATEGORIES.length;
            this.selectedCategory$.next(ORDERED_CATEGORIES[newIndex]);
            return;
          }

          if (currIndex === 0) {
            this.selectedCategory$.next(
                ORDERED_CATEGORIES[ORDERED_CATEGORIES.length - 1]);
          } else {
            this.selectedCategory$.next(ORDERED_CATEGORIES[currIndex - 1]);
          }
        });
  }
}
