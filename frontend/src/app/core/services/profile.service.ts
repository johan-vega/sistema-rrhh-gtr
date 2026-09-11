import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ProfileUpdatePayload, ApiResponse } from '../models/index';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private apiUrl  = `${environment.apiUrl}/profile`;

  get(): Observable<ApiResponse<User>> {
    if (environment.useMocks) {
      return of({ success: true, message: 'OK', data: this.auth.currentUser()! });
    }
    return this.http.get<ApiResponse<User>>(this.apiUrl);
  }

  update(payload: ProfileUpdatePayload): Observable<ApiResponse<User>> {
    if (environment.useMocks) {
      const user = { ...this.auth.currentUser()!, ...payload };
      return of({ success: true, message: 'Perfil actualizado correctamente', data: user });
    }
    return this.http.put<ApiResponse<User>>(this.apiUrl, payload);
  }
}
