import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type PostPrivacy = 'only_me' | 'villagers' | 'public';

export interface CommunityPost {
  id: number;
  user_id: number;
  content: string | null;
  media_path: string | null;
  media_type: 'image' | 'video' | null;
  media_url: string | null;
  privacy: PostPrivacy;
  is_event: boolean;
  event_title: string | null;
  event_starts_at: string | null;
  event_ends_at: string | null;
  event_location: string | null;
  created_at: string;
  author: { id: number; name: string; hometown?: string | null } | null;
}

export interface PostsPage {
  data: CommunityPost[];
  current_page: number;
  last_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getPosts(page = 1): Observable<PostsPage> {
    return this.http.get<PostsPage>(`${this.apiUrl}/posts?page=${page}`, {
      headers: this.authHeaders()
    });
  }

  getEvents(page = 1): Observable<PostsPage> {
    return this.http.get<PostsPage>(`${this.apiUrl}/events?page=${page}`, {
      headers: this.authHeaders()
    });
  }

  createPost(
    content: string,
    media?: File | null,
    privacy: PostPrivacy = 'public',
    event?: { title: string; startsAt: string; endsAt: string | null; location: string }
  ): Observable<{ message: string; data: CommunityPost }> {
    const form = new FormData();
    if (content.trim()) form.append('content', content.trim());
    if (media) form.append('media', media, media.name);
    form.append('privacy', privacy);
    form.append('is_event', event ? '1' : '0');
    if (event) {
      form.append('event_title', event.title);
      form.append('event_starts_at', event.startsAt);
      if (event.endsAt) form.append('event_ends_at', event.endsAt);
      form.append('event_location', event.location);
    }

    return this.http.post<{ message: string; data: CommunityPost }>(`${this.apiUrl}/posts`, form, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }
}
