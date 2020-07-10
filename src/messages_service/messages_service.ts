import {Inject, Injectable} from '@angular/core';

import {Observable, ReplaySubject} from 'rxjs';

import {MESSAGES_STORAGE_KEY} from '../storage_key/storage_key';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private readonly internalMessages$ = new ReplaySubject<string[]>(1);

  constructor(
      @Inject(MESSAGES_STORAGE_KEY)
          private readonly messagesStorageKey: string) {
    this.maybeInitializeStorage();
    this.internalMessages$.next(this.getStoredMessagesAsArray());
  }

  clearMessages(): void {
    window.localStorage.removeItem(this.messagesStorageKey);
    this.internalMessages$.next([]);
  }

  getMessages$(): Observable<string[]> {
    return this.internalMessages$;
  }

  sendMessage(message: string): void {
    this.maybeInitializeStorage();

    const existingMessages = this.getStoredMessagesAsArray();
    existingMessages.push(message);

    window.localStorage.setItem(
        this.messagesStorageKey, JSON.stringify(existingMessages));
    this.internalMessages$.next(existingMessages);
  }

  private getStoredMessagesAsArray(): string[] {
    return JSON.parse(window.localStorage.getItem(this.messagesStorageKey));
  }

  private maybeInitializeStorage(): void {
    if (!window.localStorage.getItem(this.messagesStorageKey)) {
      window.localStorage.setItem(this.messagesStorageKey, JSON.stringify([]));
    }
  }
}
