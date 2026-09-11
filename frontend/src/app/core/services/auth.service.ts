import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import {
  User,
  LoginCredentials,
  AuthResponse,
  ApiResponse,
} from '../models/index';

interface LaravelWorker {
  id: number;
  dni: string;
  first_name: string;
  last_name: string;
  full_name: string;
  address?: string;
  phone?: string;
  active: boolean;
  area?: User['area'];
  position?: User['position'];
}

interface LaravelUser {
  id: number;
  name: string;
  email: string;
  role: 'RRHH' | 'TRABAJADOR';
  worker?: LaravelWorker;
}

interface LaravelAuthResponse {
  success: boolean;
  message: string;
  data: { user: LaravelUser; token: string };
}

// Datos mock para desarrollo sin backend
const MOCK_USERS = {
  worker: {
    id: 1,
    name: 'Juan',
    last_name: 'Pérez García',
    full_name: 'Juan Pérez García',
    email: 'juan@empresa.com',
    role: 'worker' as const,
    dni: '12345678',
    area: { id: 1, name: 'Producción', active: true },
    position: { id: 1, name: 'Operario', active: true },
    address: 'Av. Los Pinos 123',
    phone: '987654321',
    active: true,
  },
  hr: {
    id: 2,
    name: 'María',
    last_name: 'López Ramos',
    full_name: 'María López Ramos',
    email: 'rrhh@empresa.com',
    role: 'hr' as const,
    dni: '87654321',
    area: { id: 5, name: 'Recursos Humanos', active: true },
    position: { id: 5, name: 'Jefe de RRHH', active: true },
    address: 'Jr. Las Flores 456',
    phone: '912345678',
    active: true,
  },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http    = inject(HttpClient);
  private router  = inject(Router);
  private storage = inject(StorageService);
  private apiUrl  = environment.apiUrl;

  private _currentUser = signal<User | null>(null);
  readonly currentUser  = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly userRole        = computed(() => this._currentUser()?.role ?? null);
  readonly isWorker        = computed(() => this._currentUser()?.role === 'worker');
  readonly isHr            = computed(() => this._currentUser()?.role === 'hr');

  constructor() {
    const token = this.storage.getToken();
    const user = this.storage.getUser<User>();

    if (token && user && !token.startsWith('mock-token-')) {
      this._currentUser.set(user);
    } else {
      this.storage.clear();
    }
  }

  login(credentials: LoginCredentials, remember = false): Observable<AuthResponse> {
    return this.http.post<LaravelAuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      map(res => ({
        ...res,
        data: {
          token: res.data.token,
          user: this._toUser(res.data.user),
        },
      })),
      tap(res => {
        if (res.success) this._saveSession(res.data.user, res.data.token, remember);
      }),
    );
  }

  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => of({ success: true, message: 'Sesión local cerrada', data: null })),
      finalize(() => this._clearSession()),
    );
  }

  me(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<LaravelUser>>(`${this.apiUrl}/me`).pipe(
      map(res => ({ ...res, data: this._toUser(res.data) })),
      tap(res => {
        if (res.success) {
          this._currentUser.set(res.data);
          this.storage.setUser(res.data);
        }
      }),
    );
  }

  navigateByRole(): void {
    const role = this.userRole();
    if (role === 'hr')     this.router.navigate(['/hr/dashboard'], { replaceUrl: true });
    else if (role === 'worker') this.router.navigate(['/worker/dashboard'], { replaceUrl: true });
    else                   this.router.navigate(['/login'], { replaceUrl: true });
  }

  updateCurrentUser(changes: Pick<User, 'name' | 'full_name' | 'email'>): void {
    const current = this._currentUser();
    if (!current) return;
    const user = { ...current, ...changes };
    this._currentUser.set(user);
    this.storage.setUser(user);
  }

  hasStoredSession(): boolean {
    return Boolean(this.storage.getToken() && this._currentUser());
  }

  verifySession(): Observable<boolean> {
    if (!this.hasStoredSession()) return of(false);

    return this.me().pipe(
      map(() => true),
      catchError(() => {
        this._clearSession(false);
        return of(false);
      }),
    );
  }

  private _saveSession(user: User, token: string, remember = false): void {
    this.storage.setSession(token, user, remember);
    this._currentUser.set(user);
  }

  private _clearSession(navigate = true): void {
    this.storage.clear();
    this._currentUser.set(null);
    if (navigate) this.router.navigate(['/login'], { replaceUrl: true });
  }

  private _toUser(user: LaravelUser): User {
    const worker = user.worker;

    return {
      id: user.id,
      name: worker?.first_name ?? user.name,
      last_name: worker?.last_name ?? '',
      full_name: worker?.full_name ?? user.name,
      email: user.email,
      role: user.role === 'RRHH' ? 'hr' : 'worker',
      dni: worker?.dni ?? '',
      area: worker?.area,
      position: worker?.position,
      address: worker?.address,
      phone: worker?.phone,
      active: worker?.active ?? true,
    };
  }

  // --------------------------------------------------------
  // MOCKS
  // --------------------------------------------------------
  private _mockLogin(credentials: LoginCredentials): Observable<AuthResponse> {
    const { email, password } = credentials;

    // Credenciales mock: cualquier email con "rrhh" → rol HR
    let user: User;
    if (email.includes('rrhh') || email === 'hr') {
      user = MOCK_USERS.hr;
    } else {
      user = MOCK_USERS.worker;
    }

    if (!password || password.length < 3) {
      return of({
        success: false,
        message: 'Credenciales incorrectas',
        data: { user: null as any, token: '' },
      });
    }

    const mockToken = 'mock-token-' + Date.now();
    this._saveSession(user, mockToken);

    return of({
      success: true,
      message: 'Sesión iniciada correctamente',
      data: { user, token: mockToken },
    });
  }
}
