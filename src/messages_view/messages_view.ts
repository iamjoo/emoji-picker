import {Component, Inject, OnInit} from '@angular/core';

import {MESSAGES_STORAGE_KEY} from '../storage_key/storage_key';

@Component({
  selector: 'messages-view',
  templateUrl: './messages_view.ng.html',
})
export class MessagesView implements OnInit {
  messages: string[] = [];

  constructor(
      @Inject(MESSAGES_STORAGE_KEY)
          private readonly messagesStorageKey: string) {
  }

  ngOnInit(): void {
    const existingMessagesJson =
        window.localStorage.getItem(this.messagesStorageKey);
    if (!existingMessagesJson) {
      // this.messages defaults to []
      return;
    }

    this.messages = JSON.parse(existingMessagesJson);
  }
}
