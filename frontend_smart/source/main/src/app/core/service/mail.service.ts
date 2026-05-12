import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface MailUser {
  id: string;
  name: string;
  email: string;
  role?: { name: string };
}

export interface InternalMailAttachment {
  id: string;
  mailId: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

export interface Mail {
  id: string;
  organization_id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  body: string;
  status: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  deletedBySender: boolean;
  deletedByReceiver: boolean;
  replyToId?: string;
  created_at: string;
  sender: MailUser;
  receiver: MailUser;
  attachments?: InternalMailAttachment[];
}

@Injectable({
  providedIn: 'root'
})
export class MailService {
  private apiUrl = `${environment.apiUrl}/mails`;

  constructor(private http: HttpClient) {}

  searchUsers(query: string): Observable<MailUser[]> {
    return this.http.get<MailUser[]>(`${this.apiUrl}/users/search?q=${query}`);
  }

  getMailsByFolder(folder: string): Observable<Mail[]> {
    return this.http.get<Mail[]>(`${this.apiUrl}/folder/${folder}`);
  }

  sendMail(payload: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, payload);
  }

  getMailById(id: string): Observable<Mail> {
    return this.http.get<Mail>(`${this.apiUrl}/${id}`);
  }

  updateMailAction(id: string, action: 'read' | 'delete' | 'restore' | 'star' | 'archive', value?: any, folder?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/action`, { action, value, folder });
  }
}
