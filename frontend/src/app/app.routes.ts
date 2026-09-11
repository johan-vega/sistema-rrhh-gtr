import { Routes } from '@angular/router';
import { authGuard, workerGuard, hrGuard, publicGuard } from './core/guards/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'worker',
    canActivate: [authGuard, workerGuard],
    loadComponent: () => import('./features/worker/layout/worker-layout.component').then(m => m.WorkerLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/worker/dashboard/worker-dashboard.component').then(m => m.WorkerDashboardComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/worker/profile/worker-profile.component').then(m => m.WorkerProfileComponent),
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/worker/requests/list/worker-requests-list.component').then(m => m.WorkerRequestsListComponent),
      },
      {
        path: 'requests/new',
        loadComponent: () => import('./features/worker/requests/new/worker-request-new.component').then(m => m.WorkerRequestNewComponent),
      },
      {
        path: 'requests/:id',
        loadComponent: () => import('./features/worker/requests/detail/worker-request-detail.component').then(m => m.WorkerRequestDetailComponent),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/worker/calendar/worker-calendar.component').then(m => m.WorkerCalendarComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/worker/notifications/worker-notifications.component').then(m => m.WorkerNotificationsComponent),
      },
    ],
  },
  {
    path: 'hr',
    canActivate: [authGuard, hrGuard],
    loadComponent: () => import('./features/hr/layout/hr-layout.component').then(m => m.HrLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/hr/dashboard/hr-dashboard.component').then(m => m.HrDashboardComponent),
      },
      {
        path: 'requests',
        loadComponent: () => import('./features/hr/requests/list/hr-requests-list.component').then(m => m.HrRequestsListComponent),
      },
      {
        path: 'requests/:id',
        loadComponent: () => import('./features/hr/requests/detail/hr-request-detail.component').then(m => m.HrRequestDetailComponent),
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/hr/calendar/hr-calendar.component').then(m => m.HrCalendarComponent),
      },
      {
        path: 'workers',
        loadComponent: () => import('./features/hr/workers/hr-workers-list.component').then(m => m.HrWorkersListComponent),
      },
      {
        path: 'workers/new',
        loadComponent: () => import('./features/hr/workers/hr-worker-form.component').then(m => m.HrWorkerFormComponent),
      },
      {
        path: 'workers/:id',
        loadComponent: () => import('./features/hr/workers/hr-worker-form.component').then(m => m.HrWorkerFormComponent),
      },
      {
        path: 'areas',
        loadComponent: () => import('./features/hr/areas/hr-areas.component').then(m => m.HrAreasComponent),
      },
      {
        path: 'positions',
        loadComponent: () => import('./features/hr/positions/hr-positions.component').then(m => m.HrPositionsComponent),
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/hr/categories/hr-categories.component').then(m => m.HrCategoriesComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/hr/notifications/hr-notifications.component').then(m => m.HrNotificationsComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/hr/profile/hr-profile.component').then(m => m.HrProfileComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
