import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, of, switchMap, tap, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: number;
  name: string | null;
  email: string | null;
  phone?: string | null;
  hometown?: string | null;
  referred_by?: number | null;
  referral_code?: string | null;
  profile_photo_path?: string | null;
  profile_photo_url?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface CommunityLeader {
  id: number;
  name: string;
  hometown: string | null;
  community_role: string;
  role_label: string;
  profile_photo_path?: string | null;
  profile_photo_url?: string | null;
}

export interface CommunityLeadersResponse {
  success: boolean;
  hometown: string;
  data: { representative: CommunityLeader[]; clan_head: CommunityLeader[]; youth_leader: CommunityLeader[]; cdc_chairman: CommunityLeader[] };
}

export interface MemberProfile {
  id: number; name: string | null; hometown: string | null; community_role: string | null;
  profile_photo_url: string | null; created_at: string | null;
  memories?: UserMemory[]; memories_visible?: boolean;
}
export interface MemberProfileResponse { success: boolean; data: MemberProfile; }

export interface FamilyMember {
  id: number;
  name: string | null;
  relationship: 'child' | 'father' | 'mother';
  profile_photo_url: string | null;
  claimed_user_id: number | null;
  claim_status: 'managed' | 'pending' | 'claimed';
  claim_token: string;
}

export interface FamilyProfileResponse {
  success: boolean;
  data: {
    children: FamilyMember[];
    father: FamilyMember | null;
    mother: FamilyMember | null;
    all: FamilyMember[];
  };
}


export interface FamilyClaimVerificationResponse {
  success: boolean;
  message: string;
  data: { claim_id: number; status: 'verified' | 'pending' };
}
export interface FamilyClaimReviewItem {
  id: number;
  family_profile_id: number;
  profile_name: string;
  relationship: string;
  phone_last_four: string;
  status: string;
  verified_at: string | null;
  created_at: string;
}
export interface FamilyTreePerson {
  id: number;
  name: string;
  profile_photo_url: string | null;
  is_managed: boolean;
  is_claimed: boolean;
  privacy: string;
  date_of_birth?: string | null;
  gender?: string | null;
  hometown?: string | null;
  claim_status?: string | null;
  relationship?: string | null;
}
export interface FamilyTreeEdge {
  id: number;
  person_id: number;
  related_person_id: number;
  relationship: string;
  viewer_relationship: string;
  status: string;
}
export interface FamilyTreeResponse {
  success: boolean;
  data: { root_id: number; people: FamilyTreePerson[]; relationships: FamilyTreeEdge[] };
}
export interface FamilyMatchCandidate {
  match_reference: string;
  confidence: 'strong' | 'possible';
  display_hint: string;
}
export interface FamilyMatchesResponse { success: boolean; message: string; data: FamilyMatchCandidate[]; }
export interface FamilyTreePersonResponse { success: boolean; data: FamilyTreePerson; }

export interface UserMemory {
  id: number;
  media_type: 'image' | 'video';
  url: string;
  mime_type: string;
  file_size: number;
  caption: string | null;
  created_at: string | null;
}
export interface UserMemoriesResponse { success: boolean; data: UserMemory[]; }
export interface UserMemoryUploadResponse { success: boolean; message: string; data: UserMemory; }

export interface ProfileCompletionResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly sessionChanges = new Subject<boolean>();
  readonly sessionChanges$ = this.sessionChanges.asObservable();

  constructor(private readonly http: HttpClient) {}

  register(phone: string, referralId: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      phone: phone.trim(),
      referral_id: referralId.trim(),
    }).pipe(tap((response) => this.storeSession(response)));
  }

  completeProfile(name: string, email: string, password: string, passwordConfirmation: string, hometown?: string): Observable<ProfileCompletionResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
      Accept: 'application/json',
    });
    return this.http.put<ProfileCompletionResponse>(`${this.apiUrl}/profile/complete`, {
      name: name.trim(),
      email: email.trim(),
      password,
      password_confirmation: passwordConfirmation,
      ...(hometown?.trim() ? { hometown: hometown.trim() } : {}),
    }, { headers }).pipe(tap((response) => {
      if (response.user) localStorage.setItem('auth_user', JSON.stringify(response.user));
    }));
  }

  uploadProfilePhoto(file: File): Observable<{ success: boolean; message: string; user: AuthUser }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
      Accept: 'application/json',
    });
    const form = new FormData();
    form.append('profile_photo', file, file.name);
    return this.http.post<{ success: boolean; message: string; user: AuthUser }>(
      `${this.apiUrl}/profile/photo`, form, { headers }
    ).pipe(tap((response) => {
      if (response.user) localStorage.setItem('auth_user', JSON.stringify(response.user));
    }));
  }

  login(phone: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { phone: phone.trim(), password })
      .pipe(tap((response) => this.storeSession(response)));
  }

  private storeSession(response: AuthResponse): void {
    if (response.token) {
      localStorage.setItem('token', response.token);
      if (response.user) localStorage.setItem('auth_user', JSON.stringify(response.user));
      this.sessionChanges.next(true);
    }
  }

  cacheUser(user: AuthUser): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  getCommunityLeaders(): Observable<CommunityLeadersResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.get<CommunityLeadersResponse>(`${this.apiUrl}/community-leaders`, { headers });
  }

  getMemberProfile(id: number): Observable<MemberProfileResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.get<MemberProfileResponse>(`${this.apiUrl}/members/${id}`, { headers });
  }
  getFamilyProfile(): Observable<FamilyProfileResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.get<FamilyProfileResponse>(`${this.apiUrl}/profile/family`, { headers }).pipe(timeout(15000));
  }

  createFamilyProfile(name: string, relationship: 'child' | 'father' | 'mother', phone = '', guardianRelationship: 'father' | 'mother' = 'father'): Observable<{ success: boolean; message: string; data: FamilyMember }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.post<{ success: boolean; message: string; data: FamilyMember }>(`${this.apiUrl}/profile/family`, { name, relationship, phone: phone.trim() || null, guardian_relationship: relationship === 'child' ? guardianRelationship : null }, { headers });
  }

  deleteFamilyProfile(id: number): Observable<{ success: boolean; message: string }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/profile/family/${id}`, { headers });
  }

  requestFamilyClaimOtp(claimToken: string, phone: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/family/claim/request-otp`, { claim_token: claimToken, phone });
  }

  verifyFamilyClaim(claimToken: string, phone: string, code: string): Observable<FamilyClaimVerificationResponse> {
    return this.http.post<FamilyClaimVerificationResponse>(`${this.apiUrl}/family/claim/verify`, {
      claim_token: claimToken, phone, code,
    }).pipe(tap(response => { if (response.data?.claim_id) localStorage.setItem('ogbia_pending_family_claim_id', String(response.data.claim_id)); }));
  }

  getPendingFamilyClaims(): Observable<{ success: boolean; data: FamilyClaimReviewItem[] }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.get<{ success: boolean; data: FamilyClaimReviewItem[] }>(`${this.apiUrl}/family/claims/pending`, { headers });
  }

  reviewFamilyClaim(claimId: number, decision: 'confirm' | 'dispute', reason = ''): Observable<{ success: boolean; message: string; status: string }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    const body = decision === 'dispute' ? { reason } : {};
    return this.http.post<{ success: boolean; message: string; status: string }>(`${this.apiUrl}/family/claims/${claimId}/${decision}`, body, { headers });
  }

  attachFamilyClaimToAccount(claimId: number): Observable<{ success: boolean; message: string }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/family/claims/${claimId}/attach-account`, {}, { headers });
  }

  completeFamilyClaim(claimId: number): Observable<{ success: boolean; message: string }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/family/claims/${claimId}/complete`, {}, { headers });
  }


  resumePendingFamilyClaim(): Observable<{ success: boolean; message: string } | null> {
    const claimId = Number(localStorage.getItem('ogbia_pending_family_claim_id'));
    if (!claimId || !localStorage.getItem('token')) return of(null);
    return this.attachFamilyClaimToAccount(claimId).pipe(
      switchMap(() => this.completeFamilyClaim(claimId)),
      tap(() => localStorage.removeItem('ogbia_pending_family_claim_id'))
    );
  }

  getFamilyTree(): Observable<FamilyTreeResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.get<FamilyTreeResponse>(`${this.apiUrl}/family/tree`, { headers }).pipe(timeout(20000));
  }

  getFamilyTreePerson(id: number): Observable<FamilyTreePersonResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.get<FamilyTreePersonResponse>(`${this.apiUrl}/family/tree/people/${id}`, { headers }).pipe(timeout(15000));
  }

  searchFamilyMatches(criteria: { name: string; date_of_birth?: string; gender?: string; hometown?: string }): Observable<FamilyMatchesResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.post<FamilyMatchesResponse>(`${this.apiUrl}/family/matches`, criteria, { headers }).pipe(timeout(20000));
  }

  addFamilyRelationship(payload: {
    relationship: string; name?: string; date_of_birth?: string; gender?: string;
    hometown?: string; privacy?: 'private' | 'family' | 'public'; match_reference?: string;
  }): Observable<{ success: boolean; message: string; data: { person: FamilyTreePerson; relationship: string } }> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.post<{ success: boolean; message: string; data: { person: FamilyTreePerson; relationship: string } }>(
      `${this.apiUrl}/family/tree/relationships`, payload, { headers }
    ).pipe(timeout(20000));
  }

  getMyMemories(): Observable<UserMemoriesResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    return this.http.get<UserMemoriesResponse>(`${this.apiUrl}/profile/memories`, { headers });
  }

  uploadMemory(file: File, caption = ''): Observable<UserMemoryUploadResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token ?? ''}`, Accept: 'application/json' });
    const form = new FormData();
    form.append('media', file, file.name);
    if (caption.trim()) form.append('caption', caption.trim());
    return this.http.post<UserMemoryUploadResponse>(`${this.apiUrl}/profile/memories`, form, { headers });
  }

  getAuthenticatedUser(): Observable<AuthUser> {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}`, Accept: 'application/json' })
      : new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<AuthUser>(`${this.apiUrl}/user`, { headers })
      .pipe(tap((user) => localStorage.setItem('auth_user', JSON.stringify(user))));
  }

  getCachedUser(): AuthUser | null {
    const cached = localStorage.getItem('auth_user');
    if (!cached) return null;
    try { return JSON.parse(cached) as AuthUser; }
    catch { localStorage.removeItem('auth_user'); return null; }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    this.sessionChanges.next(false);
  }
}
