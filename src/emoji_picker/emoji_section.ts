import {Directionality} from '@angular/cdk/bidi';
import {ScrollDispatcher} from '@angular/cdk/scrolling';
import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {ReplaySubject, Subject} from 'rxjs';
import {distinctUntilChanged, filter, map, pairwise, startWith, takeUntil, tap, withLatestFrom} from 'rxjs/operators';

const NUMBER_OF_EMOJIS_PER_ROW = 8;
const NUMBER_OF_ROWS = 8;

export enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

interface Cell {
  row: number;
  col: number;
  element: Element;
}

@Component({
  selector: 'emoji-section',
  templateUrl: './emoji_section.ng.html',
  styleUrls: ['./emoji_section.scss'],
})
export class EmojiSection implements AfterViewInit, OnDestroy {
  // These are populated in another service. Moved here for laziness. The
  // component has no foreknowledge of number of rows or columns
  readonly emojiRows =
      Array(NUMBER_OF_ROWS - 1).fill(1).map((currValue, index) => index);
  readonly emojisPerRow = createRowEmojis();
  // The last row may have fewer emojis
  readonly emojisInLastRow =
      createRowEmojis().slice(
          Math.floor(Math.random() * NUMBER_OF_EMOJIS_PER_ROW));

  private scrollContainerEl: Element;

  private readonly cellBlock: Cell[][] = [];
  private readonly highlightedCell$ = new ReplaySubject<Cell>(1);
  private readonly moveHighlighted$ = new Subject<Direction>();
  private readonly selectHighlighted$ = new Subject<void>();
  private readonly destroy$ = new ReplaySubject<void>(1);

  constructor(
      private readonly directionality: Directionality,
      private readonly elementRef: ElementRef,
      private readonly scrollDispatcher: ScrollDispatcher) {}

  @Input() categoryHeader: string = '';

  @Output() emojiSelected = new EventEmitter<string>();

  ngAfterViewInit(): void {
    this.populateCellBlock();
    this.setupHighlightedEmoji();
    this.setupMoveHighlighted();
    this.setupSelectHighlighted();

    this.scrollContainerEl =
        this.scrollDispatcher.getAncestorScrollContainers(this.elementRef)[0]
            .getElementRef().nativeElement;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  deselectCategory(): void {
    this.highlightedCell$.next();
  }

  getEmojiUrl(glyph: string): string {
    return emojiToUrlMapping[glyph];
  }

  highlightEmoji(row: number, col: number): void {
    this.highlightedCell$.next(this.cellBlock[row][col]);
  }

  moveHighlightedEmoji(direction: Direction): void {
    this.moveHighlighted$.next(direction);
  }

  selectCategory(): void {
    this.highlightedCell$.next(this.cellBlock[0][0]);
  }

  selectEmoji(glyph: string): void {
    this.emojiSelected.emit(glyph);
  }

  selectHighlightedEmoji(): void {
    this.selectHighlighted$.next();
  }

  private computeRightmostCol(row: number, col: number): number {
    if (col < 0) {
      return this.cellBlock[row].length - 1;
    }
    return Math.min(col, this.cellBlock[row].length - 1);
  }

  private determineNextCell(direction: Direction, currCell: Cell): Cell {
    const currRow = currCell.row;
    const currCol = currCell.col;
    let newRow: number;
    let newCol: number;

    switch (direction) {
      case Direction.UP:
        [newRow, newCol] = this.normalizeRowAndCol(currRow - 1, currCol);
        break;
      case Direction.DOWN:
        [newRow, newCol] = this.normalizeRowAndCol(currRow + 1, currCol);
        break;
      case Direction.LEFT:
        [newRow, newCol] =
            this.normalizeRowAndCol(currRow,
                this.directionality.value === 'ltr' ? currCol - 1 :
                    currCol + 1);
        break;
      case Direction.RIGHT:
        [newRow, newCol] =
            this.normalizeRowAndCol(currRow,
                this.directionality.value === 'ltr' ? currCol + 1 :
                    currCol - 1);
        break;
      default:
        // do nothing
    }

    return this.cellBlock[newRow][newCol];
  }

  private maybeScrollIntoView(cell: Cell): void {
    const emojiRect = cell.element.getBoundingClientRect();
    const scrollBottom = this.scrollContainerEl.getBoundingClientRect().bottom;
    // 68px is the height of the sticky header
    const scrollTop = this.scrollContainerEl.getBoundingClientRect().top + 68;
    if (emojiRect.top >= scrollTop && emojiRect.bottom <= scrollBottom) {
      return;
    }

    let scrollAmount;
    if (emojiRect.top < scrollTop) {
      scrollAmount = emojiRect.top - scrollTop;
    } else {
      scrollAmount = emojiRect.bottom - scrollBottom;
    }

    this.scrollContainerEl.scrollBy({
      behavior: 'smooth',
      top: scrollAmount,
    });
  }

  /**
   * @return An array of two numbers. The first is the row and the second is
   *     the column.
   */
  private normalizeRowAndCol(row: number, col: number): number[] {
    const numRows = this.cellBlock.length;
    if (row < 0) {
      // User hit UP at the top row, so move to bottom
      const newRow = numRows - 1;
      // The bottom row may have fewer columns than the rest, so move to last
      // one
      return [newRow, this.computeRightmostCol(newRow, col)];
    }

    if (row > numRows - 1) {
      // User hit DOWN at the bottom row, so move to top
      return [0, col];
    }

    const numCols = this.cellBlock[row].length;
    if (col < 0) {
      // User hit LEFT at leftmost column, so move to rightmost column. The
      // bottom row may have fewer columns than the rest, so move to rightmost
      // one
      return [row, this.computeRightmostCol(row, col)];
    }

    if (col > numCols - 1) {
      // User hit RIGHT at rightmost column, so move to leftmost column.
      return [row, 0];
    }

    if (row === numRows - 1) {
      // User may have moved to the bottom row, which may have fewer columns
      // than the rest, so move to the rightmost one
      return [row, this.computeRightmostCol(row, col)];
    }

    return [row, col];
  }

  private populateCellBlock(): void {
    const rowEls: Element[] =
        Array.from(
            this.elementRef.nativeElement.getElementsByClassName('emoji-row'));

    const numRows = rowEls.length;
    if (!numRows) {
      return;
    }

    for (let row = 0; row < numRows; row++) {
      const emojiEls: Element[] =
          Array.from(rowEls[row].getElementsByClassName('emoji'));

      const numCols = emojiEls.length;
      if (!numCols) {
        continue;
      }

      for (let col = 0; col < numCols; col++) {
        let existingCellsInRow = this.cellBlock[row];
        if (!existingCellsInRow) {
          existingCellsInRow = [];
          this.cellBlock[row] = existingCellsInRow;
        }
        existingCellsInRow[col] = {row, col, element: emojiEls[col]};
      }
    }
  }

  private setupHighlightedEmoji(): void {
    this.highlightedCell$.pipe(
        startWith(undefined),
        pairwise(),
        filter(([prevCell, currCell]) => prevCell !== currCell),
        takeUntil(this.destroy$),
        ).subscribe(([prevCell, currCell]) => {
          prevCell?.element.classList.remove('highlighted');
          currCell?.element.classList.add('highlighted');
        });
  }

  private setupMoveHighlighted(): void {
    this.moveHighlighted$.pipe(
        withLatestFrom(this.highlightedCell$),
        filter((cell) => !!cell),
        takeUntil(this.destroy$),
        ).subscribe(([direction, cell]) => {
          const nextCell = this.determineNextCell(direction, cell);
          this.highlightedCell$.next(nextCell);
          this.maybeScrollIntoView(nextCell);
        });
  }

  private setupSelectHighlighted(): void {
    this.selectHighlighted$.pipe(
        withLatestFrom(this.highlightedCell$),
        filter((cell) => !!cell),
        takeUntil(this.destroy$),
        ).subscribe(([, cell]) => {
          const imgEl = cell.element.getElementsByTagName('img')[0];
          if (!imgEl) {
            return;
          }

          this.selectEmoji(imgEl.getAttribute('alt'));
        });
  }
}

function createRowEmojis(): string[] {
  const arr = [];
  for (let i = 0; i < NUMBER_OF_EMOJIS_PER_ROW; i++) {
    const index = Math.floor(Math.random() * emojiMappingCount);
    arr.push(emojiMappingKeys[index]);
  }
  return arr;
}

const emojiToUrlMapping = {
  '😀': 'https://www.gstatic.com/voice-fe/emoji/noto_v2/emoji_u1f600.png',
  '😁': 'https://www.gstatic.com/voice-fe/emoji/noto_v2/emoji_u1f601.png',
  '😂': 'https://www.gstatic.com/voice-fe/emoji/noto_v2/emoji_u1f602.png',
  '🤣': 'https://www.gstatic.com/voice-fe/emoji/noto_v2/emoji_u1f923.png',
};

const emojiMappingKeys = Object.keys(emojiToUrlMapping);
const emojiMappingCount = emojiMappingKeys.length;
