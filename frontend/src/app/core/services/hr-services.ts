import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RequestCategory, ApiResponse, HrDashboardStats,
  LeaveRequest, RequestFilters, RejectRequestPayload,
} from '../models/index';
import { apiList, mapCategory, mapDashboard, mapRequest, mapResponse } from '../mappers/api.mappers';

// Reutilizamos las mismas solicitudes mock extendidas con info de trabajador
const MOCK_HR_REQUESTS: LeaveRequest[] = [
  {
    id: 1, employee_id: 1,
    employee: { id: 1, name: 'Juan', last_name: 'Pérez García', full_name: 'Juan Pérez García', email: 'juan@empresa.com', dni: '12345678', area: { id: 1, name: 'Producción', active: true }, position: { id: 1, name: 'Operario', active: true }, active: true },
    category: { id: 1, name: 'Vacaciones', requires_document: false, minimum_advance_days: 15, active: true },
    start_date: '2026-09-15', end_date: '2026-09-19',
    reason: 'Vacaciones familiares', status: 'APPROVED', request_date: '2026-09-01',
  },
  {
    id: 2, employee_id: 1,
    employee: { id: 1, name: 'Juan', last_name: 'Pérez García', full_name: 'Juan Pérez García', email: 'juan@empresa.com', dni: '12345678', area: { id: 1, name: 'Producción', active: true }, position: { id: 1, name: 'Operario', active: true }, active: true },
    category: { id: 3, name: 'Motivo personal', requires_document: false, minimum_advance_days: 2, active: true },
    start_date: '2026-09-22', end_date: '2026-09-22',
    reason: 'Diligencias personales', status: 'PENDING', request_date: '2026-09-08',
  },
  {
    id: 5, employee_id: 3,
    employee: { id: 3, name: 'Carlos', last_name: 'Torres Vega', full_name: 'Carlos Torres Vega', email: 'carlos@empresa.com', dni: '55667788', area: { id: 2, name: 'Logística', active: true }, position: { id: 2, name: 'Técnico', active: true }, active: true },
    category: { id: 1, name: 'Vacaciones', requires_document: false, minimum_advance_days: 15, active: true },
    start_date: '2026-09-22', end_date: '2026-09-26',
    reason: 'Descanso anual', status: 'PENDING', request_date: '2026-09-05',
  },
];

const MOCK_DASHBOARD: HrDashboardStats = {
  pending: 12,
  approved: 35,
  rejected: 4,
  cancelled: 2,
  recent_requests: MOCK_HR_REQUESTS.filter(r => r.status === 'PENDING'),
};

const MOCK_HR_CATEGORIES: RequestCategory[] = [
  { id: 1, name: 'Vacaciones', description: 'Días de vacaciones anuales', requires_document: false, minimum_advance_days: 15, active: true },
  { id: 2, name: 'Salud', description: 'Cita médica o descanso médico', requires_document: true, minimum_advance_days: 0, active: true },
  { id: 3, name: 'Motivo personal', description: 'Permiso personal', requires_document: false, minimum_advance_days: 2, active: true },
  { id: 4, name: 'Justificación de falta', description: 'Justificación de ausencia', requires_document: true, minimum_advance_days: 0, maximum_past_days: 7, is_absence: true, active: true },
  { id: 5, name: 'Licencia', description: 'Licencia por maternidad u otros', requires_document: true, minimum_advance_days: 5, active: true },
];

@Injectable({ providedIn: 'root' })
export class HrDashboardService {
  private http   = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getStats(): Observable<ApiResponse<HrDashboardStats>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_DASHBOARD });
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/hr/dashboard`).pipe(map(res => mapResponse(res, mapDashboard)));
  }
}

@Injectable({ providedIn: 'root' })
export class HrRequestService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/requests`;

  getAll(filters?: RequestFilters): Observable<ApiResponse<LeaveRequest[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_HR_REQUESTS });
    const params = {
      category_id: filters?.category_id ?? '',
      status: this.toBackendStatus(filters?.status),
      from: filters?.start_date ?? '',
      to: filters?.end_date ?? '',
    };
    return this.http.get<ApiResponse<any>>(this.apiUrl, { params }).pipe(
      map(res => mapResponse(res, data => apiList(data).map(mapRequest))),
    );
  }

  getById(id: number): Observable<ApiResponse<LeaveRequest>> {
    if (environment.useMocks) {
      const req = MOCK_HR_REQUESTS.find(r => r.id === id) ?? MOCK_HR_REQUESTS[0];
      return of({ success: true, message: 'OK', data: req });
    }
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(map(res => mapResponse(res, mapRequest)));
  }

  approve(id: number): Observable<ApiResponse<LeaveRequest>> {
    if (environment.useMocks) {
      const req = MOCK_HR_REQUESTS.find(r => r.id === id) ?? MOCK_HR_REQUESTS[0];
      req.status = 'APPROVED'; req.response_date = new Date().toISOString().split('T')[0];
      return of({ success: true, message: 'Solicitud aprobada correctamente', data: req });
    }
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/approve`, {}).pipe(map(res => mapResponse(res, mapRequest)));
  }

  reject(id: number, payload: RejectRequestPayload): Observable<ApiResponse<LeaveRequest>> {
    if (environment.useMocks) {
      const req = MOCK_HR_REQUESTS.find(r => r.id === id) ?? MOCK_HR_REQUESTS[0];
      req.status = 'REJECTED'; req.rrhh_observation = payload.observation;
      return of({ success: true, message: 'Solicitud rechazada', data: req });
    }
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/reject`, payload).pipe(map(res => mapResponse(res, mapRequest)));
  }

  cancel(id: number): Observable<ApiResponse<LeaveRequest>> {
    if (environment.useMocks) {
      const req = MOCK_HR_REQUESTS.find(r => r.id === id) ?? MOCK_HR_REQUESTS[0];
      req.status = 'CANCELLED';
      return of({ success: true, message: 'Solicitud cancelada', data: req });
    }
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/cancel`, {}).pipe(map(res => mapResponse(res, mapRequest)));
  }

  private toBackendStatus(status?: RequestFilters['status']): string {
    if (!status) return '';
    return ({ PENDING: 'PENDIENTE', APPROVED: 'APROBADA', REJECTED: 'RECHAZADA', CANCELLED: 'CANCELADA' } as const)[status];
  }
}

@Injectable({ providedIn: 'root' })
export class HrCategoryService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/categories`;

  getAll(): Observable<ApiResponse<RequestCategory[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_HR_CATEGORIES });
    return this.http.get<ApiResponse<any>>(this.apiUrl).pipe(
      map(res => mapResponse(res, data => apiList(data).map(mapCategory))),
    );
  }

  getById(id: number): Observable<ApiResponse<RequestCategory>> {
    if (environment.useMocks) {
      const cat = MOCK_HR_CATEGORIES.find(c => c.id === id) ?? MOCK_HR_CATEGORIES[0];
      return of({ success: true, message: 'OK', data: cat });
    }
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(map(res => mapResponse(res, mapCategory)));
  }

  save(payload: Partial<RequestCategory>, id?: number): Observable<ApiResponse<RequestCategory>> {
    if (environment.useMocks) {
      const cat = { id: id ?? Date.now(), name: '', requires_document: false, minimum_advance_days: 0, active: true, ...payload } as RequestCategory;
      return of({ success: true, message: id ? 'Categoría actualizada' : 'Categoría creada', data: cat });
    }
    const body = {
      ...payload,
      minimum_notice_days: payload.minimum_advance_days ?? 0,
      requires_document: payload.requires_document ?? false,
    };
    if (id) return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, body).pipe(map(res => mapResponse(res, mapCategory)));
    return this.http.post<ApiResponse<any>>(this.apiUrl, body).pipe(map(res => mapResponse(res, mapCategory)));
  }

  toggleStatus(id: number, active: boolean): Observable<ApiResponse<RequestCategory>> {
    if (environment.useMocks) return of({ success: true, message: 'Estado actualizado', data: { id, name: '', requires_document: false, minimum_advance_days: 0, active } });
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/status`, { active }).pipe(map(res => mapResponse(res, mapCategory)));
  }
}
