import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
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

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
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
