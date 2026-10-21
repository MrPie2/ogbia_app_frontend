import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FriendUser {
  id: number;
  name: string;
  email: string;
  last_seen_at: string | null;
  is_online: boolean;
  friendship_status?: 'pending' | 'accepted' | 'rejected' | null;
  request_sent_by_me?: boolean;
}

export interface FriendListResponse {
  data: FriendUser[];
  online_count: number;
}

export interface FriendRequestsResponse {
  incoming: Array<{ request_id: number; requested_at: string; id: number; name: string; email: string }>;
  outgoing: Array<{ request_id: number; requested_at: string; id: number; name: string; email: string }>;
}

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private authOptions() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      })
    };
  }

  getFriends(): Observable<FriendListResponse> {
    return this.http.get<FriendListResponse>(`${this.apiUrl}/friends`, this.authOptions());
  }

  findUsers(search = ''): Observable<{ data: FriendUser[]; current_page: number; last_page: number }> {
    const params = new HttpParams().set('search', search);
    return this.http.get<{ data: FriendUser[]; current_page: number; last_page: number }>(
      `${this.apiUrl}/friends/find`, { ...this.authOptions(), params }
    );
  }

  getRequests(): Observable<FriendRequestsResponse> {
    return this.http.get<FriendRequestsResponse>(`${this.apiUrl}/friends/requests`, this.authOptions());
  }

  sendRequest(userId: number): Observable<{ message: string; request_id: number; friendship_status: string }> {
    return this.http.post<{ message: string; request_id: number; friendship_status: string }>(
      `${this.apiUrl}/friends/requests`, { user_id: userId }, this.authOptions()
    );
  }

  acceptRequest(requestId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/friends/requests/${requestId}/accept`, {}, this.authOptions()
    );
  }
}
