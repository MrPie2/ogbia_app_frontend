import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type PostPrivacy = 'only_me' | 'villagers' | 'public';
export type PostCategory = 'general' | 'politics' | 'entertainment';

export interface CommunityPost {
  id: number;
  user_id: number;
  content: string | null;
  media_path: string | null;
  media_type: 'image' | 'video' | null;
  media_url: string | null;
  privacy: PostPrivacy;
  is_event: boolean;
  category?: PostCategory;
  event_title: string | null;
  event_starts_at: string | null;
  event_ends_at: string | null;
  event_location: string | null;
  created_at: string;
  author: { id: number; name: string; hometown?: string | null; profile_photo_url?: string | null } | null;
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
}

export interface PostComment {
  id: number;
  content: string;
  created_at: string;
  user: { id: number; name: string; profile_photo_url?: string | null };
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

  getPosts(page = 1, search = '', category = ''): Observable<PostsPage> {
    const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
    const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
    return this.http.get<PostsPage>(`${this.apiUrl}/posts?page=${page}${searchParam}${categoryParam}`, {
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
    event?: { title: string; startsAt: string; endsAt: string | null; location: string },
    category: PostCategory = 'general'
  ): Observable<{ message: string; data: CommunityPost }> {
    const form = new FormData();
    if (content.trim()) form.append('content', content.trim());
    if (media) form.append('media', media, media.name);
    form.append('privacy', privacy);
    form.append('category', category);
    form.append('is_event', event ? '1' : '0');
    if (event) {
      form.append('event_title', event.title);
      form.append('event_starts_at', new Date(event.startsAt).toISOString());
      if (event.endsAt) form.append('event_ends_at', new Date(event.endsAt).toISOString());
      form.append('event_location', event.location);
    }

    return this.http.post<{ message: string; data: CommunityPost }>(`${this.apiUrl}/posts`, form, {
      headers: this.authHeaders()
    });
  }

  toggleLike(postId: number): Observable<{ liked: boolean; likes_count: number }> {
    return this.http.post<{ liked: boolean; likes_count: number }>(`${this.apiUrl}/posts/${postId}/like`, {}, { headers: this.authHeaders() });
  }

  getComments(postId: number): Observable<{ data: PostComment[]; comments_count: number }> {
    return this.http.get<{ data: PostComment[]; comments_count: number }>(`${this.apiUrl}/posts/${postId}/comments`, { headers: this.authHeaders() });
  }

  addComment(postId: number, content: string): Observable<{ data: PostComment; comments_count: number; message: string }> {
    return this.http.post<{ data: PostComment; comments_count: number; message: string }>(`${this.apiUrl}/posts/${postId}/comments`, { content }, { headers: this.authHeaders() });
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }
}
