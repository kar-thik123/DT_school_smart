import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GlobalLoaderState {
  isLoading: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalLoaderService {
  private requestCount = 0;
  private currentMessage = '';
  private loaderSubject = new BehaviorSubject<GlobalLoaderState>({ isLoading: false, message: '' });
  public loaderState$ = this.loaderSubject.asObservable();

  constructor() {}

  show(message: string = 'Processing your request... Please wait.') {
    this.requestCount++;
    this.currentMessage = message;
    this.loaderSubject.next({ isLoading: true, message: this.currentMessage });
  }

  hide() {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.currentMessage = '';
      this.loaderSubject.next({ isLoading: false, message: '' });
    } else {
      this.loaderSubject.next({ isLoading: true, message: this.currentMessage });
    }
  }
}
