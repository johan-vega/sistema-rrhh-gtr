import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PwaService } from '../../../core/services/pwa.service';
import { timer, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-hr-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './hr-layout.component.html',
  styleUrl: './hr-layout.component.scss',
})
export class HrLayoutComponent implements OnInit {
  auth     = inject(AuthService);
  private notifications = inject(NotificationService);
  pwa = inject(PwaService);
  private destroyRef = inject(DestroyRef);
  menuOpen = false;
  private knownNotificationIds = new Set<string | number>();

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void  { this.menuOpen = false; }
  logout(): void     { this.auth.logout().subscribe(() => {}); }

  navItems = [
    { path: '/hr/dashboard',     id: 'dashboard', label: 'Dashboard' },
    { path: '/hr/requests',      id: 'requests', label: 'Solicitudes' },
    { path: '/hr/calendar',      id: 'calendar', label: 'Calendario General' },
    { path: '/hr/workers',       id: 'workers', label: 'Trabajadores' },
    { path: '/hr/areas',         id: 'areas', label: 'Áreas de Planta' },
    { path: '/hr/positions',     id: 'positions', label: 'Cargos Laborales' },
    { path: '/hr/categories',    id: 'categories', label: 'Categorías' },
    { path: '/hr/notifications', id: 'notifications', label: 'Notificaciones' },
    { path: '/hr/profile',       id: 'profile', label: 'Mi perfil' },
  ];

  ngOnInit(): void {
    timer(0, 30000).pipe(
      switchMap(() => this.notifications.getHrNotifications()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: response => {
        const notifications = response.data;
        const isFirstRead = this.knownNotificationIds.size === 0;
        const newNotifications = notifications.filter(notification => !this.knownNotificationIds.has(notification.id));
        notifications.forEach(notification => this.knownNotificationIds.add(notification.id));
        if (!isFirstRead) {
          newNotifications.filter(notification => !notification.read).forEach(notification =>
            this.pwa.showNotification(notification.title, notification.message),
          );
        }
      },
    });
  }
}
