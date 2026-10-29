import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { BehaviorSubject, Subject, Subscription, timer } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id?: string;
  title: string;
  body: string;
  role?: string;
  role_label?: string;
  url?: string;
  data?: Record<string, unknown>;
  read_at?: string | null;
}

interface NotificationResponse {
  data: Array<{ id: string; type: string; data: Record<string, unknown>; read_at: string | null }>;
  unread_count: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = environment.apiUrl;
  private pollSubscription?: Subscription;
  private readonly toastSubject = new Subject<AppNotification>();
  readonly toast$ = this.toastSubject.asObservable();
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCountSubject.asObservable();
  private readonly seenIds = new Set<string>();
  private nativeListenersReady = false;
  private pushRegistrationStarted = false;

  constructor(private readonly http: HttpClient) {}

  start(): void {
    if (!localStorage.getItem('token') || this.pollSubscription) return;
    this.poll();
    this.pollSubscription = timer(30_000, 30_000).subscribe(() => this.poll());
    if (Capacitor.isNativePlatform()) this.setupNativePush();
  }

  stop(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
    this.pushRegistrationStarted = false;
    this.unreadCountSubject.next(0);
    this.seenIds.clear();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
      Accept: 'application/json'
    });
  }

  refreshUnreadCount(): void {
    this.poll();
  }

  private poll(): void {
    if (!localStorage.getItem('token')) return;
    this.http.get<NotificationResponse>(`${this.apiUrl}/notifications`, { headers: this.headers() })
      .subscribe({
        next: response => {
          const unread = (response.data ?? []).filter(item => !item.read_at);
          this.unreadCountSubject.next(Number.isFinite(response.unread_count) ? response.unread_count : unread.length);
          const latest = unread.find(item => !this.seenIds.has(item.id));
          if (!latest) return;
          this.seenIds.add(latest.id);
          const data = latest.data ?? {};
          this.toastSubject.next({
            id: latest.id,
            title: String(data['title'] ?? 'You have a new notification'),
            body: String(data['body'] ?? ''),
            role: data['role'] ? String(data['role']) : undefined,
            role_label: data['role_label'] ? String(data['role_label']) : undefined,
            url: data['url'] ? String(data['url']) : undefined,
            data
          });
        },
        error: () => undefined
      });
  }

  markRead(id: string): void {
    this.http.patch(`${this.apiUrl}/notifications/${encodeURIComponent(id)}/read`, {}, { headers: this.headers() })
      .subscribe({ next: () => this.poll(), error: () => undefined });
  }

  private async setupNativePush(): Promise<void> {
    if (this.pushRegistrationStarted) return;
    this.pushRegistrationStarted = true;
    try {
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') return;

      if (!this.nativeListenersReady) {
        this.nativeListenersReady = true;
        await PushNotifications.addListener('registration', (token: Token) => this.registerToken(token.value));
        await PushNotifications.addListener('registrationError', () => {
          this.pushRegistrationStarted = false;
        });
        await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          const notificationId = notification.data?.['notification_id']
            ? String(notification.data['notification_id'])
            : undefined;
          if (notificationId && this.seenIds.has(notificationId)) return;
          if (notificationId) this.seenIds.add(notificationId);
          this.toastSubject.next({
            id: notificationId,
            title: notification.title || 'My Ogbia notification',
            body: notification.body || ''
          });
        });
        await PushNotifications.addListener('pushNotificationActionPerformed', (_action: ActionPerformed) => {
          this.poll();
        });
      }
      await PushNotifications.register();
    } catch {
      this.pushRegistrationStarted = false;
    }
  }

  private registerToken(token: string): void {
    if (!localStorage.getItem('token') || !token) return;
    this.http.post(`${this.apiUrl}/notifications/push-token`, { token }, { headers: this.headers() })
      .subscribe({ error: () => undefined });
  }
}
