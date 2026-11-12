import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatFriend {
  id: number;
  name: string;
  profile_photo_url?: string | null;
  last_seen_at?: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: { id: number; name: string; profile_photo_url?: string | null };
}

export interface ChatConversation {
  id: number;
  friend: ChatFriend;
  last_message: { body: string; sender_id: number; created_at: string } | null;
  unread_count: number;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly apiUrl = environment.apiUrl;
  private readonly conversationOpenedSubject = new Subject<number>();
  readonly conversationOpened$ = this.conversationOpenedSubject.asObservable();

  notifyConversationOpened(id: number): void {
    this.conversationOpenedSubject.next(id);
  }

  constructor(private readonly http: HttpClient) {}

  private options() {
    return {
      headers: new HttpHeaders({
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`
      })
    };
  }

  getConversations(): Observable<{ data: ChatConversation[] }> {
    return this.http.get<{ data: ChatConversation[] }>(`${this.apiUrl}/messages`, this.options());
  }

  startConversation(friendId: number): Observable<{ data: { id: number }; message: string }> {
    return this.http.post<{ data: { id: number }; message: string }>(
      `${this.apiUrl}/messages/conversations`, { friend_id: friendId }, this.options()
    );
  }

  getConversation(id: number): Observable<{
    conversation: { id: number; friend: ChatFriend };
    messages: { data: ChatMessage[] };
  }> {
    return this.http.get<any>(`${this.apiUrl}/messages/conversations/${id}`, this.options());
  }

  sendMessage(id: number, body: string): Observable<{ data: ChatMessage; message: string }> {
    return this.http.post<{ data: ChatMessage; message: string }>(
      `${this.apiUrl}/messages/conversations/${id}/messages`, { body }, this.options()
    );
  }

  markRead(id: number): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(
      `${this.apiUrl}/messages/conversations/${id}/read`, {}, this.options()
    ).pipe(tap(() => this.notifyConversationOpened(id)));
  }
}
