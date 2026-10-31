import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface KnowledgeRepresentative {
  id: number;
  role: string;
  full_name: string | null;
  party: string | null;
  constituency: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  bio: string | null;
  source: string | null;
  verified_at: string | null;
  community?: { id?: number; name: string; slug?: string } | null;
  ward?: { id?: number; name: string; code?: string | null } | null;
}

export interface KnowledgeWard {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  is_verified: boolean;
  communities?: Array<{ id: number; name: string; slug: string; is_verified: boolean }>;
  communities_count?: number;
}

export interface KnowledgeCommunity {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  clan_name: string | null;
  source: string | null;
  is_verified: boolean;
  wards_count?: number;
  wards?: KnowledgeWard[];
  representatives?: KnowledgeRepresentative[];
}

export interface PaginatedKnowledgeCommunities {
  data: KnowledgeCommunity[];
  current_page: number;
  last_page: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getCommunities(search = ''): Observable<PaginatedKnowledgeCommunities> {
    let params = new HttpParams().set('per_page', '200');
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<PaginatedKnowledgeCommunities>(
      `${this.apiUrl}/knowledge-base/communities`, { params }
    );
  }

  getWards(): Observable<{ data: KnowledgeWard[] }> {
    return this.http.get<{ data: KnowledgeWard[] }>(`${this.apiUrl}/knowledge-base/wards`);
  }

  getPoliticalRepresentatives(type: 'house_reps' | 'senators' | 'assembly'): Observable<{ data: KnowledgeRepresentative[] }> {
    const params = new HttpParams().set('type', type);
    return this.http.get<{ data: KnowledgeRepresentative[] }>(
      `${this.apiUrl}/knowledge-base/representatives`, { params }
    );
  }

  getCommunity(slug: string): Observable<{ data: KnowledgeCommunity }> {
    return this.http.get<{ data: KnowledgeCommunity }>(
      `${this.apiUrl}/knowledge-base/communities/${encodeURIComponent(slug)}`
    );
  }
}
