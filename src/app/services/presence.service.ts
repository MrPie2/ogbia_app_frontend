import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly apiUrl = environment.apiUrl;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly http: HttpClient) {}

  start(): void {
    if (this.timer !== null) return;
    this.heartbeat();
    this.timer = setInterval(() => this.heartbeat(), 60_000);
  }

  heartbeat(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.http.post(`${this.apiUrl}/presence/heartbeat`, {}, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      })
    }).subscribe({ error: () => undefined });
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
