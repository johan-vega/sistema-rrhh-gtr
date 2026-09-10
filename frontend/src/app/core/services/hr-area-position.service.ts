import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Area, Position, ApiResponse } from '../models/index';

const MOCK_AREAS: Area[] = [
  { id: 1, name: 'Producción', active: true },
  { id: 2, name: 'Logística', active: true },
  { id: 3, name: 'Administración', active: true },
  { id: 4, name: 'Mantenimiento', active: true },
  { id: 5, name: 'Recursos Humanos', active: true },
];

const MOCK_POSITIONS: Position[] = [
  { id: 1, name: 'Operario', active: true },
  { id: 2, name: 'Técnico', active: true },
  { id: 3, name: 'Asistente Administrativo', active: true },
  { id: 4, name: 'Supervisor de Producción', active: true },
  { id: 5, name: 'Jefe de RRHH', active: true },
  { id: 6, name: 'Técnico de Mantenimiento', active: false },
];

@Injectable({ providedIn: 'root' })
export class HrAreaService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/areas`;

  getAll(): Observable<ApiResponse<Area[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_AREAS });
    return this.http.get<ApiResponse<Area[]>>(this.apiUrl);
  }

  create(name: string): Observable<ApiResponse<Area>> {
    if (environment.useMocks) return of({ success: true, message: 'Área creada', data: { id: Date.now(), name, active: true } });
    return this.http.post<ApiResponse<Area>>(this.apiUrl, { name });
  }

  update(id: number, name: string): Observable<ApiResponse<Area>> {
    if (environment.useMocks) return of({ success: true, message: 'Área actualizada', data: { id, name, active: true } });
    return this.http.put<ApiResponse<Area>>(`${this.apiUrl}/${id}`, { name });
  }

  toggleStatus(id: number, active: boolean): Observable<ApiResponse<Area>> {
    if (environment.useMocks) return of({ success: true, message: 'Estado actualizado', data: { id, name: '', active } });
    return this.http.patch<ApiResponse<Area>>(`${this.apiUrl}/${id}/status`, { active });
  }
}

@Injectable({ providedIn: 'root' })
export class HrPositionService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/positions`;

  getAll(): Observable<ApiResponse<Position[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_POSITIONS });
    return this.http.get<ApiResponse<Position[]>>(this.apiUrl);
  }

  create(name: string): Observable<ApiResponse<Position>> {
    if (environment.useMocks) return of({ success: true, message: 'Cargo creado', data: { id: Date.now(), name, active: true } });
    return this.http.post<ApiResponse<Position>>(this.apiUrl, { name });
  }

  update(id: number, name: string): Observable<ApiResponse<Position>> {
    if (environment.useMocks) return of({ success: true, message: 'Cargo actualizado', data: { id, name, active: true } });
    return this.http.put<ApiResponse<Position>>(`${this.apiUrl}/${id}`, { name });
  }

  toggleStatus(id: number, active: boolean): Observable<ApiResponse<Position>> {
    if (environment.useMocks) return of({ success: true, message: 'Estado actualizado', data: { id, name: '', active } });
    return this.http.patch<ApiResponse<Position>>(`${this.apiUrl}/${id}/status`, { active });
  }
}
