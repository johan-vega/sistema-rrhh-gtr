import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RequestCategory, ApiResponse } from '../models/index';
import { apiList, mapCategory, mapResponse } from '../mappers/api.mappers';

const MOCK_CATEGORIES: RequestCategory[] = [
  { id: 1, name: 'Vacaciones', description: 'Solicitud de días de vacaciones anuales', requires_document: false, minimum_advance_days: 15, active: true },
  { id: 2, name: 'Salud', description: 'Cita médica, hospitalización o descanso médico', requires_document: true, minimum_advance_days: 0, active: true },
  { id: 3, name: 'Motivo personal', description: 'Permiso por asuntos personales', requires_document: false, minimum_advance_days: 2, active: true },
  { id: 4, name: 'Justificación de falta', description: 'Justificación de una ausencia ocurrida', requires_document: true, minimum_advance_days: 0, active: true },
  { id: 5, name: 'Licencia', description: 'Licencia por maternidad, paternidad u otros', requires_document: true, minimum_advance_days: 5, active: true },
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  getAll(): Observable<ApiResponse<RequestCategory[]>> {
    if (environment.useMocks) return of({ success: true, message: 'OK', data: MOCK_CATEGORIES });
    return this.http.get<ApiResponse<any>>(this.apiUrl).pipe(
      map(res => mapResponse(res, data => apiList(data).map(mapCategory))),
    );
  }

  getById(id: number): Observable<ApiResponse<RequestCategory>> {
    if (environment.useMocks) {
      const cat = MOCK_CATEGORIES.find(c => c.id === id) ?? MOCK_CATEGORIES[0];
      return of({ success: true, message: 'OK', data: cat });
    }
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}`).pipe(
      map(res => mapResponse(res, mapCategory)),
    );
  }
}
