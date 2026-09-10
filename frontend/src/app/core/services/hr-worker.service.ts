import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Worker, CreateWorkerPayload, UpdateWorkerPayload, ApiResponse,
} from '../models/index';

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
    return this.http.get<ApiResponse<Worker[]>>(this.apiUrl);
  }

  getById(id: number): Observable<ApiResponse<Worker>> {
    if (environment.useMocks) {
      const w = MOCK_WORKERS.find(w => w.id === id) ?? MOCK_WORKERS[0];
      return of({ success: true, message: 'OK', data: w });
    }
    return this.http.get<ApiResponse<Worker>>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateWorkerPayload): Observable<ApiResponse<Worker>> {
    if (environment.useMocks) {
      const newW: Worker = { id: Date.now(), ...payload, full_name: `${payload.name} ${payload.last_name}`, active: true };
      return of({ success: true, message: 'Trabajador creado correctamente', data: newW });
    }
    return this.http.post<ApiResponse<Worker>>(this.apiUrl, payload);
  }

  update(id: number, payload: UpdateWorkerPayload): Observable<ApiResponse<Worker>> {
    if (environment.useMocks) {
      const w = MOCK_WORKERS.find(w => w.id === id) ?? MOCK_WORKERS[0];
      return of({ success: true, message: 'Trabajador actualizado', data: { ...w, ...payload } });
    }
    return this.http.put<ApiResponse<Worker>>(`${this.apiUrl}/${id}`, payload);
  }

  toggleStatus(id: number, active: boolean): Observable<ApiResponse<Worker>> {
    if (environment.useMocks) {
      const w = MOCK_WORKERS.find(w => w.id === id) ?? MOCK_WORKERS[0];
      w.active = active;
      return of({ success: true, message: `Trabajador ${active ? 'activado' : 'desactivado'}`, data: w });
    }
    return this.http.patch<ApiResponse<Worker>>(`${this.apiUrl}/${id}/status`, { active });
  }
}
