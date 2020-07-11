import {ContentObserver} from '@angular/cdk/observers';
import {AfterViewInit, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MatSlideToggleChange} from '@angular/material/slide-toggle';

import {combineLatest, from, fromEvent, merge, Observable, of as observableOf, ReplaySubject} from 'rxjs';
import {delay, distinctUntilChanged, filter, map, shareReplay, startWith, takeUntil, tap} from 'rxjs/operators';

import {MessagesService} from '../messages_service/messages_service';

@Component({
  selector: 'message-entry',
  templateUrl: './message_entry.ng.html',
  styleUrls: ['./message_entry.scss'],
})
export class MessageEntry implements AfterViewInit, OnDestroy, OnInit {
  readonly isMessagingEnabled$ = new ReplaySubject<boolean>();
  hasMessageEntered$: Observable<boolean>;
  placeholderText$: Observable<string>;
  sendButtonDisabled$: Observable<boolean>;
  private messageEntryEl: Element;

  readonly sendMessage$ = new ReplaySubject<KeyboardEvent>();
  private readonly destroy$ = new ReplaySubject<void>(1);

  constructor(
      private readonly contentObserver: ContentObserver,
      private readonly messagesService: MessagesService) {}

  ngOnInit(): void {
    // better way to do placeholder?
    // check on firefox and ie

    this.messageEntryEl = document.getElementById('message-entry');
    this.hasMessageEntered$ = this.createHasMessageEntered();
    this.placeholderText$ = this.createPlaceholderText();
    this.sendButtonDisabled$ = this.createSendButtonDisabled();
    this.setupSendMessageClick();
    this.isMessagingEnabled$.next(true);
  }

  ngAfterViewInit(): void {
    this.insertRowIfMessageEntryEmpty();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  clearMessages(): void {
    this.messagesService.clearMessages();
  }

  insertNewRow(event: KeyboardEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (event.repeat) {
      return;
    }

    const currentSelection = window.getSelection();
    const currentRange = currentSelection.getRangeAt(0);

    const currentRowEl =
        this.findContainingElInMessageEntry(
            currentRange.commonAncestorContainer);
    if (!currentRowEl) {
      return;
    }

    // If the user has made a selection, delete it first
    if (!currentRange.collapsed) {
      currentRange.deleteContents();

      // If the user selected all the contents of the row, insert <br> so it
      // doesn't collapse
      currentRowEl.normalize();
      maybeInsertBr(currentRowEl);
    }

    // Creates a new range that
    // - starts at the end of the user selection
    // - ends at the end of the row
    const newRange = new Range();
    newRange.setStart(currentRange.endContainer, currentRange.endOffset);
    newRange.setEndAfter(currentRowEl.lastChild);

    const extractedContents = newRange.extractContents();
    extractedContents.normalize();
    currentRowEl.normalize()

    // If the previous row is now empty, insert <br> so it doesn't collapse
    maybeInsertBr(currentRowEl);

    // Create a new <p> element and either insert the extracted contents or
    // insert <br> if the extacted contents are empty
    const newRowEl = document.createElement('p');
    if (extractedContents.hasChildNodes()) {
      newRowEl.appendChild(extractedContents);
    } else {
      newRowEl.appendChild(document.createElement('br'));
    }

    currentRowEl.after(newRowEl);

    // Move caret to the new row
    currentSelection.collapse(newRowEl);
  }

  paste(event: ClipboardEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Remove any user selected text first
    const selection = window.getSelection();
    selection.deleteFromDocument();

    const clipboardData = event.clipboardData.getData('text/plain');
    console.log(clipboardData);

    const pasteContents = clipboardData.split(/\r?\n/);

    if (pasteContents.length === 1) {
      const currentRange = selection.getRangeAt(0);
      const currentRowEl = this.findContainingElInMessageEntry(
          selection.getRangeAt(0).endContainer);

      currentRange.deleteContents();
      currentRange.insertNode(
          document.createTextNode(pasteContents[0]));
      currentRowEl.normalize();

      selection.collapseToEnd();
      return;
    }

    let docFragment = document.createDocumentFragment();
    let extractedContents: DocumentFragment;

    for (let i = 0; i < pasteContents.length; i++) {
      const pasteContent = pasteContents[i];
      console.log(pasteContent);

      if (i === 0) {
        const currentRange = selection.getRangeAt(0);
        const currentRowEl = this.findContainingElInMessageEntry(
            selection.getRangeAt(0).endContainer);

        // Creates a new range that
        // - starts at the end of the user selection
        // - ends at the end of the row
        const newRange = new Range();
        newRange.setStart(currentRange.endContainer, currentRange.endOffset);
        newRange.setEndAfter(currentRowEl.lastChild);

        extractedContents = newRange.extractContents();
        extractedContents.normalize();

        currentRange.insertNode(
            document.createTextNode(pasteContent));
        currentRowEl.normalize();

        selection.collapseToEnd();
        continue;
      }

      const newEl = document.createElement('p');
      newEl.appendChild(document.createTextNode(pasteContent));
      maybeInsertBr(newEl);

      docFragment.appendChild(newEl);

      if (i === pasteContents.length - 1) {
        const lastInsertedRow = docFragment.lastChild;
        this.findContainingElInMessageEntry(
            selection.getRangeAt(0).endContainer).after(docFragment);

        if (extractedContents.hasChildNodes()) {
          lastInsertedRow.appendChild(extractedContents);
          lastInsertedRow.normalize();
        }

        selection.collapse(
            lastInsertedRow.lastChild,
            lastInsertedRow.lastChild.textContent.length);
        selection.collapseToEnd();
      }
    }
  }

  toggled(event: MatSlideToggleChange): void {
    this.isMessagingEnabled$.next(event.checked);
  }

  private createHasMessageEntered(): Observable<boolean> {
    return merge(
        fromEvent(this.messageEntryEl, 'keydown'), this.sendMessage$).pipe(
            // delay so key presses, such as backspace, are processed first
            delay(1),
            map(() => this.hasMessageEntered()),
            distinctUntilChanged(),
            startWith(this.hasMessageEntered()),
            shareReplay(1),
            )
  }

  private createPlaceholderText(): Observable<string> {
    return this.isMessagingEnabled$.pipe(
        map((isMessagingEnabled) => {
          return isMessagingEnabled ? 'Enter a message' : 'Messaging disabled';
        }),
        )
  }

  private createSendButtonDisabled(): Observable<boolean> {
    return combineLatest(
        this.isMessagingEnabled$, this.hasMessageEntered$).pipe(
            map(([isMessagingEnabled, hasMessageEntered]) => {
              return !isMessagingEnabled || !hasMessageEntered;
            }),
            )
  }

  /**
   * Finds the child element in the message entry that contains the provided
   * node.
   * @return null if no such element can be found
   */
  private findContainingElInMessageEntry(node: Node): Element|null {
    let el =
        node.nodeType === Node.ELEMENT_NODE ? (node as Element) :
            node.parentElement;
    const messageElChildren = Array.from(this.messageEntryEl.children);

    while (el) {
      if (messageElChildren.includes(el)) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  private hasMessageEntered(): boolean {
    return this.messageEntryEl.children.length > 1 ||
        !!this.messageEntryEl.textContent ||
        this.messageEntryEl.getElementsByTagName('img').length > 0;
  }

  /**
   * Inserts a row into the message entry if it gets removed.
   */
  private insertRowIfMessageEntryEmpty(): void {
    this.contentObserver.observe(this.messageEntryEl).pipe(
        map((mutations) => {
          // We only care if children were removed from the message entry
          return mutations.filter((mutation) => {
            return mutation.type === 'childList' &&
                mutation.target === this.messageEntryEl &&
                mutation.removedNodes.length;
          });
        }),
        filter((mutations) => mutations.length > 0),
        takeUntil(this.destroy$),
        ).subscribe(() => {
          if (this.messageEntryEl.children.length > 0) {
            return;
          }

          const newEl = document.createElement('p');
          newEl.appendChild(document.createElement('br'));
          this.messageEntryEl.appendChild(newEl);
        });
  }

  private sendMessage(event?: KeyboardEvent): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.hasMessageEntered() || event?.repeat) {
      return;
    }

    console.log('sending message...');

    this.messagesService.sendMessage(
        formatMessageForSending(this.messageEntryEl));
    this.messageEntryEl.textContent = null;
  }

  private setupSendMessageClick(): void {
    this.sendMessage$.pipe(
        takeUntil(this.destroy$),
        ).subscribe((event) => {
          this.sendMessage(event);
        });
  }
}

function formatMessageForSending(el: Element): string {
  const strings: string[] = [];

  for (let row of Array.from(el.children)) {
    let stringToAdd = '';
    for (let child of Array.from(row.childNodes)) {
      if (child.nodeName.toUpperCase() === 'IMG') {
        stringToAdd += (child as Element).getAttribute('alt');
        continue;
      }
      stringToAdd += child.textContent;
    }
    strings.push(stringToAdd);
  }

  return strings.join('\n');
}

function maybeInsertBr(node: Node): void {
  if (!node.hasChildNodes()) {
    node.appendChild(document.createElement('br'));
    return;
  }

  if (node.childNodes.length > 1) {
    return;
  }

  if (!node.childNodes[0].textContent) {
    node.appendChild(document.createElement('br'));
  }
}
