import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, HrReportFilters, HrRequestAnalytics, HrRequestReport, RequestStatus } from '../models/index';
import { apiList, mapRequest, mapResponse } from '../mappers/api.mappers';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/hr/reports/requests`;

  getRequestReport(filters: HrReportFilters): Observable<ApiResponse<HrRequestReport>> {
    if (environment.useMocks) {
      return of({
        success: true,
        message: 'OK',
        data: { summary: { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 }, items: [] },
      });
    }

    return this.http.get<ApiResponse<any>>(this.apiUrl, { params: this.params(filters) }).pipe(
      map(response => mapResponse(response, data => ({
        summary: data.summary,
        items: apiList(data.items).map(mapRequest),
      }))),
    );
  }

  exportRequestReport(filters: HrReportFilters): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export`, {
      params: this.params(filters),
      responseType: 'blob',
    });
  }

  getRequestAnalytics(filters: HrReportFilters): Observable<ApiResponse<HrRequestAnalytics>> {
    if (environment.useMocks) {
      return of({ success: true, message: 'OK', data: { total: 0, approved: 0, rejected: 0, series: [] } });
    }
    return this.http.get<ApiResponse<HrRequestAnalytics>>(`${environment.apiUrl}/hr/analytics/requests`, { params: this.params(filters) });
  }

  private params(filters: HrReportFilters): Record<string, string> {
    const params: Record<string, string> = {};
    if (filters.from) params['from'] = filters.from;
    if (filters.to) params['to'] = filters.to;
    if (filters.worker_id) params['worker_id'] = String(filters.worker_id);
    if (filters.area_id) params['area_id'] = String(filters.area_id);
    if (filters.category_id) params['category_id'] = String(filters.category_id);
    if (filters.status) params['status'] = this.toBackendStatus(filters.status);
    return params;
  }

  private toBackendStatus(status: RequestStatus): string {
    return ({ PENDING: 'PENDIENTE', APPROVED: 'APROBADA', REJECTED: 'RECHAZADA', CANCELLED: 'CANCELADA' } as const)[status];
  }
}
