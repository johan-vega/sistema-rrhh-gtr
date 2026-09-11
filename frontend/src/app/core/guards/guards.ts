import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
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
  const auth   = inject(AuthService);
  if (!auth.isAuthenticated()) return true;
  const role = auth.userRole();
  if (role === 'hr')     return inject(Router).createUrlTree(['/hr/dashboard']);
  if (role === 'worker') return inject(Router).createUrlTree(['/worker/dashboard']);
  return true;
};
