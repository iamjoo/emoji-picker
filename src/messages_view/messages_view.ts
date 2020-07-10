import {AfterViewInit, Component, ElementRef, OnDestroy} from '@angular/core';

import {Observable, Subject} from 'rxjs';
import {shareReplay, takeUntil, tap} from 'rxjs/operators';

import {MessagesService} from '../messages_service/messages_service';

@Component({
  selector: 'messages-view',
  templateUrl: './messages_view.ng.html',
  styleUrls: ['./messages_view.scss'],
})
export class MessagesView implements AfterViewInit, OnDestroy {
  messages$: Observable<string[]> = this.createMessagesObs();

  private scrollEl: Element;
  private readonly destroy$ = new Subject<void>();

  constructor(
      private readonly elementRef: ElementRef,
      private readonly messagesService: MessagesService) {}

  ngAfterViewInit(): void {
    this.setupAutoScroll();
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createMessagesObs(): Observable<string[]> {
    return this.messagesService.getMessages$().pipe(
        shareReplay(1),
        );
  }

  private getScrollableEl(): Element {
    if (!this.scrollEl) {
      this.scrollEl =
          this.elementRef.nativeElement.getElementsByClassName('container')[0];
    }

    return this.scrollEl;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.getScrollableEl().scrollTop = this.getScrollableEl().scrollHeight;
    });
  }

  private setupAutoScroll(): void {
    this.messages$.pipe(
        takeUntil(this.destroy$),
        ).subscribe(() => {
          this.scrollToBottom();
        });
  }
}
