import {Component, Inject} from '@angular/core';

import {MESSAGES_STORAGE_KEY} from '../storage_key/storage_key';

@Component({
  selector: 'message-entry',
  templateUrl: './message_entry.ng.html',
  styleUrls: ['./message_entry.scss'],
})
export class MessageEntry {
  constructor(
      @Inject(MESSAGES_STORAGE_KEY)
          private readonly messagesStorageKey: string) {
  }

  clearMessages(): void {
    window.localStorage.removeItem(this.messagesStorageKey);
  }

  sendMessage(): void {
    console.log('sending message...');
    const messageEntryEl = document.getElementById('message-entry');
    if (!messageEntryEl) {
      return;
    }

    if (!window.localStorage.getItem(this.messagesStorageKey)) {
      window.localStorage.setItem(this.messagesStorageKey, JSON.stringify([]));
    }

    const existingMessages: string[] =
        JSON.parse(window.localStorage.getItem(this.messagesStorageKey));

    existingMessages.push(messageEntryEl.textContent);

    window.localStorage.setItem(
        this.messagesStorageKey, JSON.stringify(existingMessages));
    messageEntryEl.textContent = null;
  }
}
