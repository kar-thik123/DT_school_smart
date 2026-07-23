import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { io, Socket } from 'socket.io-client';
import { LocalStorageService } from '@shared/services';

export interface Notification {
  id: string;
  organization_id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  icon?: string;
  color: string;
  referenceId?: string;
  isRead: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private socket: Socket | null = null;
  private newNotification$ = new Subject<Notification>();
  private _notifications$ = new BehaviorSubject<Notification[]>([]);
  private _unreadCount$ = new BehaviorSubject<number>(0);

  /** Observable of all notifications */
  notifications$ = this._notifications$.asObservable();

  /** Observable of unread count */
  unreadCount$ = this._unreadCount$.asObservable();

  constructor(
    private http: HttpClient,
    private storage: LocalStorageService
  ) { }

  // --- REST API Methods ---

  /** Fetch notifications from server and update local state */
  loadNotifications(): void {
    this.http.get<Notification[]>(this.apiUrl).subscribe({
      next: (notifications) => {
        this._notifications$.next(notifications);
        this.updateUnreadCount(notifications);
      },
      error: (err) => console.error('Failed to load notifications:', err)
    });
  }

  /** Mark a single notification as read */
  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this._notifications$.value.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        this._notifications$.next(current);
        this.updateUnreadCount(current);
      })
    );
  }

  /** Mark all notifications as read */
  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const current = this._notifications$.value.map(n => ({ ...n, isRead: true }));
        this._notifications$.next(current);
        this._unreadCount$.next(0);
      })
    );
  }

  /** Delete a single notification */
  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this._notifications$.value.filter(n => n.id !== id);
        this._notifications$.next(current);
        this.updateUnreadCount(current);
      })
    );
  }

  // --- WebSocket Methods ---

  /** Connect to Socket.io server for real-time notifications */
  connectSocket(): void {
    if (this.socket || !(environment as any).enableRealtimeNotifications) return;

    let token = this.storage.get('token') as string;
    if (!token) {
      token = sessionStorage.getItem('token') as string;
    }
    if (!token) return;

    // Automatically connect to the current origin instead of hardcoding localhost
    const wsUrl = window.location.origin;

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10
    });

    this.socket.on('connect', () => {
      console.log('🔌 Notification socket connected');
    });

    this.socket.on('new-notification', (notification: Notification) => {
      console.log('🔔 New notification received:', notification);
      // Prepend to the list
      const current = [notification, ...this._notifications$.value];
      this._notifications$.next(current);
      this.updateUnreadCount(current);
      this.newNotification$.next(notification);
    });

    this.socket.on('remove-notification', (data: { referenceId: string }) => {
      console.log('🔔 Remove notification event received:', data);
      const current = this._notifications$.value.filter(n => n.referenceId !== data.referenceId);
      this._notifications$.next(current);
      this.updateUnreadCount(current);
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Notification socket disconnected');
    });

    this.socket.on('connect_error', (err: Error) => {
      console.warn('🔌 Socket connection error:', err.message);
    });
  }

  /** Listen for new incoming notifications (for toast/sound triggers) */
  onNewNotification(): Observable<Notification> {
    return this.newNotification$.asObservable();
  }

  /** Disconnect socket */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // --- Helpers ---

  private updateUnreadCount(notifications: Notification[]): void {
    const count = notifications.filter(n => !n.isRead).length;
    this._unreadCount$.next(count);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
