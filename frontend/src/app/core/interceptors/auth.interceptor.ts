import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const router  = inject(Router);

  const token = storage.getToken();

  // Clonar la request con el header de autorización si hay token
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    : req.clone({
        setHeaders: { Accept: 'application/json' },
      });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Sesión expirada → limpiar y redirigir al login
        storage.clear();
        router.navigate(['/login'], {
          queryParams: { expired: '1' },
          replaceUrl: true,
        });
      }
      return throwError(() => error);
    }),
  );
};
