import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import {
  User,
  LoginCredentials,
  AuthResponse,
  ApiResponse,
} from '../models/index';

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

  // Señal reactiva del usuario actual
  private _currentUser = signal<User | null>(this.storage.getUser<User>());
  readonly currentUser  = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly userRole        = computed(() => this._currentUser()?.role ?? null);
  readonly isWorker        = computed(() => this._currentUser()?.role === 'worker');
  readonly isHr            = computed(() => this._currentUser()?.role === 'hr');

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    if (environment.useMocks) {
      return this._mockLogin(credentials);
    }
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success) this._saveSession(res.data.user, res.data.token);
      }),
    );
  }

  logout(): Observable<ApiResponse<null>> {
    if (environment.useMocks) {
      this._clearSession();
      return of({ success: true, message: 'Sesión cerrada', data: null });
    }
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this._clearSession()),
    );
  }

  me(): Observable<ApiResponse<User>> {
    if (environment.useMocks) {
      const user = this._currentUser();
      return of({ success: true, message: 'OK', data: user! });
    }
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
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

  private _saveSession(user: User, token: string): void {
    this.storage.setToken(token);
    this.storage.setUser(user);
    this._currentUser.set(user);
  }

  private _clearSession(): void {
    this.storage.clear();
    this._currentUser.set(null);
    this.router.navigate(['/login'], { replaceUrl: true });
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
