import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);

  get(url: string): Observable<Blob> {
    // HttpClient pasa por el interceptor y adjunta el token Sanctum.
    return this.http.get(url, { responseType: 'blob' });
  }
}
