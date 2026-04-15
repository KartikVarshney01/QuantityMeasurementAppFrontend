import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/models';

export interface UserInfo {
  token:  string;
  name:   string;
  email:  string;
  userId: number;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

const SESSION_KEY = 'qm_session';
export const API_BASE = 'http://localhost:5000';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = new BehaviorSubject<UserInfo | null>(this.loadSession());

  /** Observable of the currently logged-in user (null = guest). */
  readonly user$ = this._user.asObservable();

  constructor(private http: HttpClient) {}

  get isLoggedIn(): boolean     { return this._user.value !== null; }
  get currentUser(): UserInfo | null { return this._user.value; }
  get token(): string | null    { return this._user.value?.token ?? null; }

  /** Log in with email + password. Stores JWT on success. */
  login(req: LoginRequest): Observable<AuthResult> {
    return this.http.post<AuthResponse>(`${API_BASE}/api/auth/login`, req).pipe(
      tap(res => this.persist(res)),
      map(()  => ({ success: true,  message: 'Login successful.' })),
      catchError(err => {
        const msg = err.error?.message ?? 'Login failed. Please check your credentials.';
        return of({ success: false, message: msg });
      })
    );
  }

  /** Register a new account. Stores JWT on success. */
  register(req: RegisterRequest): Observable<AuthResult> {
    return this.http.post<AuthResponse>(`${API_BASE}/api/auth/register`, req).pipe(
      tap(res => this.persist(res)),
      map(()  => ({ success: true,  message: 'Registration successful.' })),
      catchError(err => {
        const msg = err.error?.message ?? 'Registration failed. Please try again.';
        return of({ success: false, message: msg });
      })
    );
  }

  /** Clear session and log out. */
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this._user.next(null);
  }

  private persist(res: AuthResponse): void {
    const info: UserInfo = { token: res.token, name: res.name, email: res.email, userId: res.userId };
    localStorage.setItem(SESSION_KEY, JSON.stringify(info));
    this._user.next(info);
  }

  private loadSession(): UserInfo | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) as UserInfo : null;
    } catch { return null; }
  }
}
