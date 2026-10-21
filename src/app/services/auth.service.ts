import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  [key: string]: unknown;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          if (response.user) {
            localStorage.setItem('auth_user', JSON.stringify(response.user));
          }
        }
      })
    );
  }

  getAuthenticatedUser(): Observable<AuthUser> {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}`, Accept: 'application/json' })
      : new HttpHeaders({ Accept: 'application/json' });

    return this.http.get<AuthUser>(`${this.apiUrl}/user`, { headers }).pipe(
      tap((user) => localStorage.setItem('auth_user', JSON.stringify(user)))
    );
  }

  getCachedUser(): AuthUser | null {
    const cached = localStorage.getItem('auth_user');
    if (!cached) return null;

    try {
      return JSON.parse(cached) as AuthUser;
    } catch {
      localStorage.removeItem('auth_user');
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
  }
}
