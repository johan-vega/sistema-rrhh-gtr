import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LeaveRequest, CreateRequestPayload, RejectRequestPayload,
  ApiResponse, RequestFilters, RequestStatus,
} from '../models/index';
import { apiList, mapRequest, mapResponse } from '../mappers/api.mappers';

const MOCK_REQUESTS: LeaveRequest[] = [
  {
    id: 1, employee_id: 1,
    category: { id: 1, name: 'Vacaciones', description: '', requires_document: false, minimum_advance_days: 15, active: true },
    start_date: '2026-09-15', end_date: '2026-09-19',
    reason: 'Vacaciones familiares', status: 'APPROVED',
    request_date: '2026-09-01', response_date: '2026-09-02',
    rrhh_observation: 'Aprobado sin inconvenientes.',
    history: [
      { id: 1, action: 'CREATED', description: 'Solicitud creada', user_name: 'Juan Pérez', created_at: '2026-09-01T10:35:00Z' },
      { id: 2, action: 'APPROVED', description: 'Solicitud aprobada', user_name: 'María López (RRHH)', created_at: '2026-09-02T08:17:00Z' },
    ],
  },
  {
    id: 2, employee_id: 1,
    category: { id: 3, name: 'Motivo personal', description: '', requires_document: false, minimum_advance_days: 2, active: true },
    start_date: '2026-09-22', end_date: '2026-09-22',
    reason: 'Diligencias personales', status: 'PENDING',
    request_date: '2026-09-08',
    history: [
      { id: 3, action: 'CREATED', description: 'Solicitud creada', user_name: 'Juan Pérez', created_at: '2026-09-08T14:00:00Z' },
    ],
  },
  {
    id: 3, employee_id: 1,
    category: { id: 2, name: 'Salud', description: '', requires_document: true, minimum_advance_days: 0, active: true },
    start_date: '2026-09-02', end_date: '2026-09-02',
    reason: 'Cita médica', status: 'REJECTED',
    request_date: '2026-09-02', response_date: '2026-09-02',
    rrhh_observation: 'No se adjuntó el documento requerido.',
    history: [
      { id: 4, action: 'CREATED', description: 'Solicitud creada', user_name: 'Juan Pérez', created_at: '2026-09-02T07:00:00Z' },
      { id: 5, action: 'REJECTED', description: 'Solicitud rechazada', user_name: 'María López (RRHH)', created_at: '2026-09-02T09:00:00Z' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class RequestService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/requests`;

  getAll(filters?: RequestFilters): Observable<ApiResponse<LeaveRequest[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_REQUESTS });
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
      const req = MOCK_REQUESTS.find(r => r.id === id) ?? MOCK_REQUESTS[0];
      return of({ success: true, message: 'OK', data: req });
    }
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(map(res => mapResponse(res, mapRequest)));
  }

  create(payload: CreateRequestPayload): Observable<ApiResponse<LeaveRequest>> {
    if (environment.useMocks) {
      const newReq: LeaveRequest = {
        id: Date.now(), employee_id: 1,
        category: { id: payload.category_id, name: 'Categoría', requires_document: false, minimum_advance_days: 0, active: true },
        start_date: payload.start_date, end_date: payload.end_date,
        reason: payload.reason, status: 'PENDING', request_date: new Date().toISOString().split('T')[0],
        history: [{ id: Date.now(), action: 'CREATED', description: 'Solicitud creada', user_name: 'Tú', created_at: new Date().toISOString() }],
      };
      return of({ success: true, message: 'Solicitud enviada correctamente', data: newReq });
    }
    const form = new FormData();
    form.append('category_id', String(payload.category_id));
    form.append('start_date', payload.start_date);
    form.append('end_date', payload.end_date);
    form.append('reason', payload.reason);
    if (payload.document) form.append('documents[]', payload.document);
    // Algunos navegadores móviles pueden conservar visualmente valores al
    // volver del selector de archivos y omitirlos en el multipart. Esta parte
    // estándar del formulario conserva los campos y no genera un nuevo CORS.
    form.append('_request_metadata', this.encodeRequestMetadata({
        category_id: payload.category_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        reason: payload.reason,
    }));
    return this.http.post<ApiResponse<any>>(this.apiUrl, form).pipe(map(res => mapResponse(res, mapRequest)));
  }

  cancel(id: number): Observable<ApiResponse<LeaveRequest>> {
    if (environment.useMocks) {
      const req = MOCK_REQUESTS.find(r => r.id === id);
      if (req) req.status = 'CANCELLED';
      return of({ success: true, message: 'Solicitud cancelada', data: req! });
    }
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/cancel`, {}).pipe(map(res => mapResponse(res, mapRequest)));
  }

  private toBackendStatus(status?: RequestStatus | ''): string {
    return ({ PENDING: 'PENDIENTE', APPROVED: 'APROBADA', REJECTED: 'RECHAZADA', CANCELLED: 'CANCELADA' } as const)[status as RequestStatus] ?? '';
  }

  private encodeRequestMetadata(metadata: Record<string, string | number>): string {
    const bytes = new TextEncoder().encode(JSON.stringify(metadata));
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));

    return btoa(binary)
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
  }
}
