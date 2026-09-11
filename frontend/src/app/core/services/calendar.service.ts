import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CalendarEvent, ApiResponse } from '../models/index';

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 1, title: 'Vacaciones', start_date: '2026-09-15', end_date: '2026-09-19', category: 'Vacaciones', status: 'APPROVED' },
  { id: 3, title: 'Salud', start_date: '2026-10-05', end_date: '2026-10-05', category: 'Salud', status: 'APPROVED' },
];

const MOCK_HR_EVENTS: CalendarEvent[] = [
  { id: 1, title: 'Vacaciones', start_date: '2026-09-15', end_date: '2026-09-19', category: 'Vacaciones', status: 'APPROVED', employee_name: 'Juan Pérez' },
  { id: 2, title: 'Salud', start_date: '2026-09-10', end_date: '2026-09-11', category: 'Salud', status: 'APPROVED', employee_name: 'María López' },
  { id: 3, title: 'Vacaciones', start_date: '2026-09-22', end_date: '2026-09-26', category: 'Vacaciones', status: 'APPROVED', employee_name: 'Carlos Torres' },
  { id: 4, title: 'Motivo personal', start_date: '2026-09-18', end_date: '2026-09-18', category: 'Motivo personal', status: 'APPROVED', employee_name: 'Ana García' },
];

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Calendario del trabajador (solo sus aprobadas)
  getWorkerEvents(): Observable<ApiResponse<CalendarEvent[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_EVENTS });
    return this.http.get<ApiResponse<CalendarEvent[]>>(`${this.apiUrl}/calendar`);
  }

  // Calendario RRHH (todos los trabajadores)
  getHrEvents(): Observable<ApiResponse<CalendarEvent[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_HR_EVENTS });
    return this.http.get<ApiResponse<CalendarEvent[]>>(`${this.apiUrl}/hr/calendar`);
  }
}
