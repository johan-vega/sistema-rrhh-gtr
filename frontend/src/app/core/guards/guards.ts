import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.hasStoredSession()) return router.createUrlTree(['/login']);
  return auth.verifySession().pipe(map(valid => valid ? true : router.createUrlTree(['/login'])));
};

export const workerGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isWorker()) return true;
  if (auth.isHr()) return router.createUrlTree(['/hr/dashboard']);
  return router.createUrlTree(['/login']);
};

export const hrGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isHr()) return true;
  if (auth.isWorker()) return router.createUrlTree(['/worker/dashboard']);
  return router.createUrlTree(['/login']);
};

export const publicGuard: CanActivateFn = () => {
  // La URL pública de inicio siempre muestra el formulario de acceso.
  // Una sesión recordada solo se usa al navegar a una ruta privada.
  return true;
};
