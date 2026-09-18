import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Subscription, timer, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HrWorkerService } from '../../../core/services/hr-worker.service';
import { WorkerPhotoComponent } from '../../../shared/components/worker-photo.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Worker } from '../../../core/models/index';

@Component({
  selector: 'app-hr-workers-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, WorkerPhotoComponent, ConfirmDialogComponent],
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
          (ngModelChange)="searchWorkers()"
          aria-label="Buscar trabajadores por nombre, DNI o área"
          maxlength="255"
          placeholder="Buscar por nombre, DNI o área..." 
          class="input-search" 
        />
      </div>
      @if (deleteError()) { <p role="alert">{{ deleteError() }}</p> }
      @if (deleteSuccess()) { <p role="status">{{ deleteSuccess() }}</p> }

      <p *ngIf="loading()" role="status">Cargando trabajadores…</p>
      <div *ngIf="error()" role="alert">
        {{ error() }} <button class="btn-toggle" (click)="loadWorkers(page())">Reintentar</button>
      </div>
      <p *ngIf="!loading() && !error()" role="status" class="results-count">
        Mostrando {{ workers().length ? (page() - 1) * perPage() + 1 : 0 }}–{{ workers().length ? (page() - 1) * perPage() + workers().length : 0 }} de {{ total() }} trabajadores
      </p>
      <p *ngIf="!loading() && !error() && !workers().length">No se encontraron trabajadores.</p>
      <div class="workers-grid" [attr.aria-busy]="loading()">
        <div *ngFor="let worker of workers()" class="worker-card">
          <div class="card-header">
            <div class="avatar"><app-worker-photo [workerId]="worker.id" [hasPhoto]="!!worker.has_photo" [initials]="getInitials(worker.name, worker.last_name)" /></div>
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
              [disabled]="deleting()"
              [class.deactivate]="worker.active"
            >
              {{ worker.active ? 'Desactivar' : 'Activar' }}
            </button>
            <button type="button" class="btn-toggle btn-delete" [disabled]="deleting()" (click)="confirmDelete(worker)">Eliminar</button>
            <a [routerLink]="['/hr/workers', worker.id]" class="btn-edit">Editar</a>
          </div>
        </div>
      </div>
      <nav class="pagination" aria-label="Paginación de trabajadores">
        <button class="btn-toggle previous" [disabled]="loading() || page() <= 1" (click)="loadWorkers(page() - 1)">Anterior</button>
        <span>Página {{ page() }} de {{ lastPage() }}</span>
        <button class="btn-toggle next" [disabled]="loading() || page() >= lastPage()" (click)="loadWorkers(page() + 1)">Siguiente</button>
      </nav>
      @if (pendingDeletion(); as worker) {
        <app-confirm-dialog title="Eliminar trabajador definitivamente"
          [message]="'¿Eliminar a ' + worker.full_name + ' (DNI: ' + worker.dni + ')? Se eliminarán su cuenta de acceso y fotografía. No se puede deshacer. Si tiene solicitudes, deberás usar Desactivar.'"
          confirmLabel="Eliminar definitivamente" (confirmed)="deleteWorker()" (dismissed)="pendingDeletion.set(null)" />
      }
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
      background: var(--color-primary);
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
      &:focus { border-color: var(--color-accent); }
    }
    .workers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
      gap: 1.25rem;
    }
    .pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1.25rem; }
    .pagination .btn-toggle { flex: 0 0 auto; padding: 0.5rem 1rem; }
    .btn-toggle:disabled { opacity: 0.5; cursor: default; }
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
      background: var(--color-primary);
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
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .btn-delete { color: #dc2626; border-color: #fca5a5; }
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
      background: var(--color-accent);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.8rem;
      text-align: center;
    }
  `]
})
export class HrWorkersListComponent implements OnInit, OnDestroy {
  private workerService = inject(HrWorkerService);
  private listSubscription?: Subscription;

  workers = signal<Worker[]>([]);
  page = signal(1);
  perPage = signal(20);
  total = signal(0);
  loading = signal(false);
  error = signal('');
  searchQuery = '';
  pendingDeletion = signal<Worker | null>(null);
  deleting = signal(false);
  deleteError = signal('');
  deleteSuccess = signal('');

  ngOnInit(): void {
    this.loadWorkers();
  }

  ngOnDestroy(): void { this.listSubscription?.unsubscribe(); }

  lastPage(): number { return Math.max(1, Math.ceil(this.total() / this.perPage())); }

  searchWorkers(): void { this.loadWorkers(1, 300); }

  loadWorkers(page = 1, delay = 0): void {
    // Cancelar la consulta anterior para que una respuesta tardía no cambie la búsqueda actual.
    this.listSubscription?.unsubscribe();
    this.page.set(page);
    this.loading.set(true);
    this.error.set('');
    this.workers.set([]);
    const search = this.searchQuery;
    this.listSubscription = timer(delay).pipe(switchMap(() => this.workerService.getPage(page, search))).subscribe({
      next: res => {
        this.loading.set(false);
        if (!res.success) { this.error.set('No se pudo cargar la lista de trabajadores.'); return; }
        this.workers.set(res.data.items);
        this.page.set(res.data.page);
        this.perPage.set(res.data.per_page);
        this.total.set(res.data.total);
        // Volver a la última página si se eliminó su único registro.
        if (res.data.page > this.lastPage()) this.loadWorkers(this.lastPage());
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar la lista de trabajadores. Inténtalo nuevamente.');
      },
    });
  }

  getInitials(name: string, lastName: string): string {
    return `${name[0] || ''}${lastName[0] || ''}`.toUpperCase();
  }

  confirmDelete(worker: Worker): void {
    if (this.deleting()) return;
    this.deleteError.set('');
    this.deleteSuccess.set('');
    this.pendingDeletion.set(worker);
  }

  deleteWorker(): void {
    const worker = this.pendingDeletion();
    if (!worker || this.deleting()) return;
    this.pendingDeletion.set(null);
    this.deleting.set(true);
    this.workerService.deleteWorker(worker.id).subscribe({
      next: res => {
        this.deleting.set(false);
        if (!res.success) { this.deleteError.set(res.message); return; }
        this.deleteSuccess.set(res.message);
        this.loadWorkers(this.page());
      },
      error: err => {
        this.deleting.set(false);
        this.deleteError.set((Object.values(err?.error?.errors ?? {}).flat()[0] as string)
          || err?.error?.message || 'No se pudo eliminar el trabajador. Actualiza la lista antes de reintentar.');
      },
    });
  }

  toggleStatus(worker: Worker): void {
    this.workerService.toggleStatus(worker.id, !worker.active).subscribe(res => {
      if (res.success) {
        worker.active = !worker.active;
      }
    });
  }
}
