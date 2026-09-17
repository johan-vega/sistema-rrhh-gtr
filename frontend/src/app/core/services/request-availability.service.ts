import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, expand, last, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/index';

@Injectable({ providedIn: 'root' })
export class RequestAvailabilityService {
  private http = inject(HttpClient);
  firstBlockedDate(from: string, to: string): Observable<string | null> {
    // La API limita cada consulta a 366 días; consultar rangos largos por bloques.
    const chunk = (start: string): Observable<{ next: string; blocked: string | null }> => {
      const endDate = new Date(start + 'T00:00:00Z');
      endDate.setUTCDate(endDate.getUTCDate() + 365);
      const end = [endDate.toISOString().slice(0, 10), to].sort()[0];
      const next = new Date(end + 'T00:00:00Z'); next.setUTCDate(next.getUTCDate() + 1);
      return this.http.get<ApiResponse<{ blocked_dates: string[] }>>(`${environment.apiUrl}/requests/availability`, {
        params: { from: start, to: end, 'ngsw-bypass': 'true' },
      }).pipe(map(res => ({ next: next.toISOString().slice(0, 10), blocked: res.data.blocked_dates[0] ?? null })));
    };
    return chunk(from).pipe(
      expand(state => !state.blocked && state.next <= to ? chunk(state.next) : EMPTY),
      last(), map(state => state.blocked),
    );
  }
}
