import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StoryItem {
  id: number;
  user_id: number;
  type: 'text' | 'image' | 'video';
  content: string | null;
  media_path: string | null;
  media_url: string | null;
  expires_at: string;
  created_at: string;
  author?: { id: number; name: string } | null;
}

export interface StoryGroup {
  user: { id: number; name: string };
  is_mine: boolean;
  has_unseen: boolean;
  stories: StoryItem[];
}

@Injectable({ providedIn: 'root' })
export class StoriesService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getStories(): Observable<{ data: StoryGroup[] }> {
    return this.http.get<{ data: StoryGroup[] }>(`${this.apiUrl}/stories`, { headers: this.headers() });
  }

  createStory(type: 'text' | 'image' | 'video', content: string, media?: File | null): Observable<{ message: string; data: StoryItem }> {
    const form = new FormData();
    form.append('type', type);
    if (content.trim()) form.append('content', content.trim());
    if (media) form.append('media', media, media.name);
    return this.http.post<{ message: string; data: StoryItem }>(`${this.apiUrl}/stories`, form, { headers: this.headers() });
  }

  deleteStory(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/stories/${id}`, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
  }
}