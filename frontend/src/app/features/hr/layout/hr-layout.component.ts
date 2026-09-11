import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-hr-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './hr-layout.component.html',
  styleUrl: './hr-layout.component.scss',
})
export class HrLayoutComponent {
  auth     = inject(AuthService);
  menuOpen = false;

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
  ];
}
