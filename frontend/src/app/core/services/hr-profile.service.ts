import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/index';
import { AuthService } from './auth.service';

export interface HrProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface HrProfileUpdatePayload {
  name: string;
  email: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

@Injectable({ providedIn: 'root' })
export class HrProfileService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiUrl;

  get(): Observable<ApiResponse<HrProfile>> {
    return this.http.get<ApiResponse<HrProfile>>(`${this.apiUrl}/hr/profile`);
  }

  update(payload: HrProfileUpdatePayload): Observable<ApiResponse<HrProfile>> {
    return this.http.put<ApiResponse<HrProfile>>(`${this.apiUrl}/hr/profile`, payload).pipe(
      tap(response => {
        if (response.success) {
          this.auth.updateCurrentUser({
            name: response.data.name,
            full_name: response.data.name,
            email: response.data.email,
          });
        }
      }),
    );
  }
}
