import { NgClass } from '@angular/common';
import { Component, EventEmitter, Output, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgScrollbar } from 'ngx-scrollbar';

export interface Message {
  sender: string;
  text: string;
  time: string;
}

@Component({
    selector: 'app-chat-widget',
    imports: [
        NgScrollbar,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        NgClass,
    ],
    templateUrl: './chat-widget.component.html',
    styleUrl: './chat-widget.component.scss'
})
export class ChatWidgetComponent {
  readonly avatar = input<string>('assets/images/user/user2.jpg');
  readonly userName = input<string>('Aiden Chavez');
  readonly newMessagesCount = input<number>(0);

  readonly messages = input<Message[]>([]);
  @Output() messageSent = new EventEmitter<string>();

  messageText: string = '';

  sendMessage() {
    if (this.messageText.trim()) {
      const newMessage: Message = {
        sender: this.userName(),
        text: this.messageText,
        time: new Date().toLocaleTimeString(),
      };
      this.messages().push(newMessage);
      this.messageSent.emit(this.messageText);
      this.messageText = '';
    }
  }
}
