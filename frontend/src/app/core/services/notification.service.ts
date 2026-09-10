import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification, ApiResponse } from '../models/index';

const MOCK_NOTIFS: AppNotification[] = [
  { id: 1, title: 'Solicitud aprobada', message: 'Tu solicitud de vacaciones del 15 al 19 de septiembre fue aprobada.', read: false, created_at: '2026-09-02T08:17:00Z', request_id: 1 },
  { id: 2, title: 'Solicitud rechazada', message: 'Tu solicitud de Salud del 02 de septiembre fue rechazada. Motivo: No se adjuntó documento.', read: true, created_at: '2026-09-02T09:00:00Z', request_id: 3 },
];

const MOCK_HR_NOTIFS: AppNotification[] = [
  { id: 10, title: 'Nueva solicitud', message: 'Juan Pérez envió una solicitud de Motivo personal para el 22 de septiembre.', read: false, created_at: '2026-09-08T14:00:00Z', request_id: 2 },
  { id: 11, title: 'Nueva solicitud', message: 'Carlos Torres envió una solicitud de Vacaciones del 22 al 26 de septiembre.', read: true, created_at: '2026-09-07T10:00:00Z', request_id: 5 },
];

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getWorkerNotifications(): Observable<ApiResponse<AppNotification[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_NOTIFS });
    return this.http.get<ApiResponse<AppNotification[]>>(`${this.apiUrl}/notifications`);
  }

  getHrNotifications(): Observable<ApiResponse<AppNotification[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_HR_NOTIFS });
    return this.http.get<ApiResponse<AppNotification[]>>(`${this.apiUrl}/hr/notifications`);
  }

  markRead(id: number): Observable<ApiResponse<null>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: null });
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllRead(): Observable<ApiResponse<null>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: null });
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/notifications/read-all`, {});
  }

  unreadCount(notifs: AppNotification[]): number {
    return notifs.filter(n => !n.read).length;
  }
}
