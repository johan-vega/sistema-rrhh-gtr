import { Injectable } from '@angular/core';

const TOKEN_KEY = 'rrhh_token';
const USER_KEY  = 'rrhh_user';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  }

  /** Guarda la sesión solo para esta pestaña o de forma persistente, según la elección del usuario. */
  setSession(token: string, user: unknown, remember: boolean): void {
    this.clear();
    const target = remember ? localStorage : sessionStorage;
    target.setItem(TOKEN_KEY, token);
    target.setItem(USER_KEY, JSON.stringify(user));
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getUser<T>(): T | null {
    const raw = sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  }

  setUser(user: unknown): void {
    const target = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
    target.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}
