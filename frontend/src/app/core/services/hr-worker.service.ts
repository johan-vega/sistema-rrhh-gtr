import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, switchMap, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Worker, CreateWorkerPayload, UpdateWorkerPayload, ApiResponse, PaginatedResponse,
} from '../models/index';
import { apiList, mapResponse, mapWorker } from '../mappers/api.mappers';

const MOCK_WORKERS: Worker[] = [
  { id: 1, name: 'Juan', last_name: 'Pérez García', full_name: 'Juan Pérez García', email: 'juan@empresa.com', dni: '12345678', area: { id: 1, name: 'Producción', active: true }, position: { id: 1, name: 'Operario', active: true }, address: 'Av. Los Pinos 123', phone: '987654321', active: true },
  { id: 3, name: 'Carlos', last_name: 'Torres Vega', full_name: 'Carlos Torres Vega', email: 'carlos@empresa.com', dni: '55667788', area: { id: 2, name: 'Logística', active: true }, position: { id: 2, name: 'Técnico', active: true }, phone: '956789012', active: true },
  { id: 4, name: 'Ana', last_name: 'García Ruiz', full_name: 'Ana García Ruiz', email: 'ana@empresa.com', dni: '99001122', area: { id: 1, name: 'Producción', active: true }, position: { id: 1, name: 'Operario', active: true }, active: true },
  { id: 5, name: 'Pedro', last_name: 'Sánchez', full_name: 'Pedro Sánchez', email: 'pedro@empresa.com', dni: '11223344', area: { id: 3, name: 'Administración', active: true }, position: { id: 3, name: 'Asistente', active: true }, active: false },
];

@Injectable({ providedIn: 'root' })
export class HrWorkerService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/workers`;

  getAll(): Observable<ApiResponse<Worker[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_WORKERS });
    return this.http.get<ApiResponse<any>>(this.apiUrl).pipe(
      map(res => mapResponse(res, data => apiList(data).map(mapWorker))),
    );
  }

  getPage(page = 1, search = ''): Observable<PaginatedResponse<Worker>> {
    if (environment.useMocks) {
      const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const workers = MOCK_WORKERS.filter(worker => terms.every(term =>
        `${worker.full_name} ${worker.dni} ${worker.area?.name ?? ''}`.toLowerCase().includes(term)));
      return of({ success: true, message: 'OK', data: {
        items: workers.slice((page - 1) * 20, page * 20), total: workers.length, page, per_page: 20,
      } });
    }
    return this.http.get<ApiResponse<any> & { meta: Omit<PaginatedResponse<Worker>['data'], 'items'> }>(this.apiUrl, {
      params: { page, search: search.trim() },
    }).pipe(map(res => ({
      success: res.success, message: res.message,
      data: { ...res.meta, items: apiList(res.data).map(mapWorker) },
    })));
  }

  getById(id: number): Observable<ApiResponse<Worker>> {
    if (environment.useMocks) {
      const w = MOCK_WORKERS.find(w => w.id === id) ?? MOCK_WORKERS[0];
      return of({ success: true, message: 'OK', data: w });
    }
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(map(res => mapResponse(res, mapWorker)));
  }

  create(payload: CreateWorkerPayload): Observable<ApiResponse<Worker>> {
    if (environment.useMocks) {
      const newW: Worker = { id: Date.now(), ...payload, full_name: `${payload.name} ${payload.last_name}`, active: true };
      return of({ success: true, message: 'Trabajador creado correctamente', data: newW });
    }
    if (payload.photo) return defer(() => this.photoForm(payload, true)).pipe(
      switchMap(form => this.http.post<ApiResponse<any>>(this.apiUrl, form, { params: { 'ngsw-bypass': 'true' } })),
      map(res => mapResponse(res, mapWorker)),
    );
    return this.http.post<ApiResponse<any>>(this.apiUrl, this.toBackendPayload(payload, true)).pipe(map(res => mapResponse(res, mapWorker)));
  }

  update(id: number, payload: UpdateWorkerPayload): Observable<ApiResponse<Worker>> {
    if (environment.useMocks) {
      const w = MOCK_WORKERS.find(w => w.id === id) ?? MOCK_WORKERS[0];
      return of({ success: true, message: 'Trabajador actualizado', data: { ...w, ...payload } });
    }
    if (payload.photo) return defer(() => this.photoForm(payload, false)).pipe(
      switchMap(form => this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}`, form, { params: { 'ngsw-bypass': 'true' } })),
      map(res => mapResponse(res, mapWorker)),
    );
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, this.toBackendPayload(payload)).pipe(map(res => mapResponse(res, mapWorker)));
  }

  toggleStatus(id: number, active: boolean): Observable<ApiResponse<Worker>> {
    if (environment.useMocks) {
      const w = MOCK_WORKERS.find(w => w.id === id) ?? MOCK_WORKERS[0];
      w.active = active;
      return of({ success: true, message: `Trabajador ${active ? 'activado' : 'desactivado'}`, data: w });
    }
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/${id}/status`, { active }).pipe(map(res => mapResponse(res, mapWorker)));
  }

  deleteWorker(id: number): Observable<ApiResponse<null>> {
    if (environment.useMocks) {
      const index = MOCK_WORKERS.findIndex(worker => worker.id === id);
      if (index >= 0) MOCK_WORKERS.splice(index, 1);
      return of({ success: true, message: 'Trabajador eliminado', data: null });
    }
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  private async photoForm(payload: CreateWorkerPayload | UpdateWorkerPayload, creating: boolean): Promise<FormData> {
    const form = new FormData();
    Object.entries(this.toBackendPayload(payload, creating)).forEach(([key, value]) => {
      if (value !== undefined) form.append(key, value === null ? '' : String(value));
    });
    if (!creating) form.append('_method', 'PUT');
    const photo = payload.photo!;
    const bytes = await photo.arrayBuffer();
    form.append('photo', new Blob([bytes], { type: photo.type }), photo.name);
    return form;
  }

  private toBackendPayload(payload: CreateWorkerPayload | UpdateWorkerPayload, creating = false): Record<string, unknown> {
    const { name, last_name, photo, has_photo, ...rest } = payload;
    return {
      ...rest,
      first_name: name,
      last_name,
      ...(creating ? { password_confirmation: (payload as CreateWorkerPayload).password } : {}),
      ...(!creating && !payload.password ? { password: undefined, password_confirmation: undefined } : {}),
    };
  }
}
