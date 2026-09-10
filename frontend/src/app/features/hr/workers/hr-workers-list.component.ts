import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HrWorkerService } from '../../../core/services/hr-worker.service';
import { Worker } from '../../../core/models/index';

@Component({
  selector: 'app-hr-workers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="workers-container">
      <div class="header-bar">
        <div>
          <h2>Gestión de Trabajadores</h2>
          <p>Administra el personal, sus áreas, cargos y accesos al sistema.</p>
        </div>
        <a routerLink="/hr/workers/new" class="btn-primary">+ Nuevo Trabajador</a>
      </div>

      <div class="search-box">
        <input 
          type="text" 
          [(ngModel)]="searchQuery" 
          placeholder="Buscar por nombre, DNI o área..." 
          class="input-search" 
        />
      </div>

      <div class="workers-grid">
        <div *ngFor="let worker of filteredWorkers()" class="worker-card">
          <div class="card-header">
            <div class="avatar">{{ getInitials(worker.name, worker.last_name) }}</div>
            <div class="worker-info">
              <h3>{{ worker.full_name }}</h3>
              <span class="dni-text">DNI: {{ worker.dni }}</span>
            </div>
            <span class="status-badge" [class.active]="worker.active" [class.inactive]="!worker.active">
              {{ worker.active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="card-details">
            <div class="detail-item">
              <span class="label">Área:</span>
              <span class="val">{{ worker.area?.name || 'Sin área' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Cargo:</span>
              <span class="val">{{ worker.position?.name || 'Sin cargo' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Correo:</span>
              <span class="val">{{ worker.email }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button 
              (click)="toggleStatus(worker)" 
              class="btn-toggle"
              [class.deactivate]="worker.active"
            >
              {{ worker.active ? 'Desactivar' : 'Activar' }}
            </button>
            <a [routerLink]="['/hr/workers', worker.id]" class="btn-edit">Editar</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workers-container {
      padding: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
      p { color: #64748b; font-size: 0.88rem; margin: 0.2rem 0 0 0; }
    }
    .btn-primary {
      background: #1e3a5f;
      color: #fff;
      padding: 0.65rem 1.2rem;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      font-size: 0.88rem;
      box-shadow: 0 4px 12px rgba(30, 58, 95, 0.2);
    }
    .search-box {
      margin-bottom: 1.5rem;
    }
    .input-search {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
      outline: none;
      &:focus { border-color: #2e86de; }
    }
    .workers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .worker-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1e3a5f;
      color: #fff;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }
    .worker-info {
      flex: 1;
      h3 { margin: 0; font-size: 1rem; font-weight: 800; color: #1e293b; }
      .dni-text { font-size: 0.75rem; color: #64748b; }
    }
    .status-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.25rem 0.6rem;
      border-radius: 20px;
      &.active { background: #dcfce7; color: #166534; }
      &.inactive { background: #fee2e2; color: #991b1b; }
    }
    .card-details {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    .detail-item {
      display: flex;
      justify-content: space-between;
      .label { color: #64748b; }
      .val { font-weight: 700; color: #334155; }
    }
    .card-actions {
      display: flex;
      gap: 0.6rem;
    }
    .btn-toggle {
      flex: 1;
      padding: 0.5rem;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      &.deactivate { color: #dc2626; border-color: #fca5a5; }
    }
    .btn-edit {
      padding: 0.5rem 1rem;
      border-radius: 10px;
      background: #2e86de;
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.8rem;
      text-align: center;
    }
  `]
})
export class HrWorkersListComponent implements OnInit {
  private workerService = inject(HrWorkerService);

  workers = signal<Worker[]>([]);
  searchQuery = '';

  ngOnInit(): void {
    this.loadWorkers();
  }

  loadWorkers(): void {
    this.workerService.getAll().subscribe(res => {
      if (res.success && res.data) {
        this.workers.set(res.data);
      }
    });
  }

  filteredWorkers(): Worker[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.workers();
    return this.workers().filter(w =>
      w.full_name.toLowerCase().includes(q) ||
      w.dni.includes(q) ||
      (w.area?.name && w.area.name.toLowerCase().includes(q))
    );
  }

  getInitials(name: string, lastName: string): string {
    return `${name[0] || ''}${lastName[0] || ''}`.toUpperCase();
  }

  toggleStatus(worker: Worker): void {
    this.workerService.toggleStatus(worker.id, !worker.active).subscribe(res => {
      if (res.success) {
        worker.active = !worker.active;
      }
    });
  }
}
