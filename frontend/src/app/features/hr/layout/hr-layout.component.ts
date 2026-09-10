import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-hr-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './hr-layout.component.html',
  styleUrl: './hr-layout.component.scss',
})
export class HrLayoutComponent {
  auth          = inject(AuthService);
  menuOpen      = false;

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void  { this.menuOpen = false; }
  logout(): void     { this.auth.logout().subscribe(() => {}); }

  navItems = [
    { path: '/hr/dashboard',      icon: '🏠', label: 'Dashboard' },
    { path: '/hr/requests',       icon: '📋', label: 'Solicitudes' },
    { path: '/hr/calendar',       icon: '📅', label: 'Calendario' },
    { path: '/hr/workers',        icon: '👥', label: 'Trabajadores' },
    { path: '/hr/areas',          icon: '🏭', label: 'Áreas' },
    { path: '/hr/positions',      icon: '💼', label: 'Cargos' },
    { path: '/hr/categories',     icon: '🗂️', label: 'Categorías' },
    { path: '/hr/notifications',  icon: '🔔', label: 'Notificaciones' },
  ];
}
