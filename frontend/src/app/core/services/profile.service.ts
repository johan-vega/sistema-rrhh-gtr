import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ProfileUpdatePayload, ApiResponse } from '../models/index';
import { AuthService } from './auth.service';
import { mapResponse, mapWorker } from '../mappers/api.mappers';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private apiUrl  = `${environment.apiUrl}/profile`;

  get(): Observable<ApiResponse<User>> {
    if (environment.useMocks) {
      return of({ success: true, message: 'OK', data: this.auth.currentUser()! });
    }
    return this.http.get<ApiResponse<any>>(this.apiUrl).pipe(
      map(res => mapResponse(res, data => ({ ...this.auth.currentUser()!, ...mapWorker(data) }))),
    );
  }

  update(payload: ProfileUpdatePayload): Observable<ApiResponse<User>> {
    if (environment.useMocks) {
      const user = { ...this.auth.currentUser()!, ...payload };
      return of({ success: true, message: 'Perfil actualizado correctamente', data: user });
    }
    return this.http.put<ApiResponse<any>>(this.apiUrl, payload).pipe(
      map(res => mapResponse(res, data => ({ ...this.auth.currentUser()!, ...mapWorker(data) }))),
    );
  }
}
