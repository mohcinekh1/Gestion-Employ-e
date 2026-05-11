import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  RegisterDepartmentDTO,
  RegisterRequest
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  currentUser = signal<CurrentUser | null>(null);
  isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.restoreFromToken();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  getRegisterMetadata(): Observable<RegisterDepartmentDTO[]> {
    return this.http.get<RegisterDepartmentDTO[]>(`${this.apiUrl}/register/metadata`);
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    const body: Record<string, unknown> = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email.trim().toLowerCase(),
      position: payload.position.trim(),
      departmentId: payload.departmentId,
      password: payload.password
    };
    const ph = payload.phone?.trim();
    if (ph) body['phone'] = ph;
    const hd = payload.hireDate?.trim();
    if (hd) body['hireDate'] = hd.slice(0, 10);
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, body).pipe(tap((r) => this.persistSession(r)));
  }

  private persistSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    this.currentUser.set({
      username: response.username,
      role: response.role,
      employeeId: response.employeeId ?? null
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  hasRole(roles: string[]): boolean {
    const user = this.currentUser();
    return !!user && roles.includes(user.role);
  }

  private restoreFromToken(): void {
    const token = this.getToken();
    if (!token) return;
    try {
      const payload = this.decodeToken(token) as {
        sub: string;
        role: CurrentUser['role'];
        employeeId?: number;
        exp: number;
      };
      if (payload.exp * 1000 < Date.now()) {
        this.logout();
        return;
      }
      this.currentUser.set({
        username: payload.sub,
        role: payload.role,
        employeeId: payload.employeeId ?? null
      });
    } catch {
      this.logout();
    }
  }

  private decodeToken(token: string): unknown {
    const base64Payload = token.split('.')[1];
    const jsonPayload = atob(base64Payload);
    return JSON.parse(jsonPayload);
  }
}
