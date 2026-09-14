import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HrWorkerService } from '../../../core/services/hr-worker.service';
import { HrAreaService, HrPositionService } from '../../../core/services/hr-area-position.service';
import { Area, Position, CreateWorkerPayload } from '../../../core/models/index';

@Component({
  selector: 'app-hr-worker-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="form-card">
        <h2>{{ isEdit ? 'Editar Trabajador' : 'Nuevo Trabajador' }}</h2>
        <p class="subtitle">Ingresa la información personal y laboral del empleado.</p>

        <form (ngSubmit)="onSubmit()" #form="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label>Nombres *</label>
              <input type="text" [(ngModel)]="payload.name" name="name" required class="input-control" />
            </div>

            <div class="form-group">
              <label>Apellidos *</label>
              <input type="text" [(ngModel)]="payload.last_name" name="last_name" required class="input-control" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>DNI *</label>
              <input type="text" [(ngModel)]="payload.dni" name="dni" required maxlength="8" class="input-control" />
            </div>

            <div class="form-group">
              <label>Correo Electrónico *</label>
              <input type="email" [(ngModel)]="payload.email" name="email" required class="input-control" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Área *</label>
              <select [(ngModel)]="payload.area_id" name="area_id" required class="input-control">
                <option [ngValue]="undefined" disabled>Selecciona un área</option>
                <option *ngFor="let a of areas" [value]="a.id">{{ a.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Cargo *</label>
              <select [(ngModel)]="payload.position_id" name="position_id" required class="input-control">
                <option [ngValue]="undefined" disabled>Selecciona un cargo</option>
                <option *ngFor="let p of positions" [value]="p.id">{{ p.name }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input type="text" [(ngModel)]="payload.phone" name="phone" class="input-control" />
            </div>

            <div class="form-group">
              <label>Dirección</label>
              <input type="text" [(ngModel)]="payload.address" name="address" class="input-control" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Tope mensual de permisos</label>
              <input type="number" [(ngModel)]="payload.monthly_permission_limit" name="monthly_permission_limit" min="0" placeholder="Vacío = sin tope" class="input-control" />
            </div>
            <div class="form-group">
              <label>Tope mensual de faltas</label>
              <input type="number" [(ngModel)]="payload.monthly_absence_limit" name="monthly_absence_limit" min="0" placeholder="Vacío = sin tope" class="input-control" />
            </div>
          </div>

          @if (!isEdit) {
            <div class="form-row">
              <div class="form-group">
                <label>Contraseña inicial *</label>
                <input type="password" [(ngModel)]="payload.password" name="password" required minlength="8" autocomplete="new-password" class="input-control" />
              </div>
            </div>
          }

          <div class="form-actions">
            <a routerLink="/hr/workers" class="btn-cancel">Cancelar</a>
            <button type="submit" [disabled]="!form.valid || loading" class="btn-submit">
              {{ loading ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Trabajador') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 1.5rem;
      max-width: 750px;
      margin: 0 auto;
    }
    .form-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.75rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0; }
      .subtitle { color: #64748b; font-size: 0.88rem; margin: 0.2rem 0 1.5rem 0; }
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1.1rem;
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      label { font-size: 0.8rem; font-weight: 700; color: #475569; }
    }
    .input-control {
      padding: 0.7rem 0.9rem;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      font-size: 0.88rem;
      outline: none;
      &:focus { border-color: var(--color-accent); }
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.8rem;
      margin-top: 1.75rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
      padding: 0.65rem 1.2rem;
      border-radius: 10px;
      background: #f1f5f9;
      color: #475569;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.88rem;
    }
    .btn-submit {
      padding: 0.65rem 1.4rem;
      border-radius: 10px;
      background: var(--color-primary);
      color: #fff;
      border: none;
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class HrWorkerFormComponent implements OnInit {
  private workerService = inject(HrWorkerService);
  private areaService = inject(HrAreaService);
  private positionService = inject(HrPositionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  workerId?: number;
  loading = false;

  areas: Area[] = [];
  positions: Position[] = [];

  payload: CreateWorkerPayload = {
    name: '',
    last_name: '',
    email: '',
    dni: '',
    password: '',
    area_id: 1,
    position_id: 1,
    phone: '',
    address: ''
  };

  ngOnInit(): void {
    this.loadOptions();

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit = true;
      this.workerId = Number(id);
      this.loadWorker(this.workerId);
    }
  }

  loadOptions(): void {
    this.areaService.getAll().subscribe(res => { if (res.success && res.data) this.areas = res.data; });
    this.positionService.getAll().subscribe(res => { if (res.success && res.data) this.positions = res.data; });
  }

  loadWorker(id: number): void {
    this.workerService.getById(id).subscribe(res => {
      if (res.success && res.data) {
        const w = res.data;
        this.payload = {
          name: w.name,
          last_name: w.last_name,
          email: w.email,
          dni: w.dni,
          password: '',
          area_id: w.area?.id ?? 1,
          position_id: w.position?.id ?? 1,
          phone: w.phone ?? '',
          address: w.address ?? '',
          monthly_permission_limit: w.monthly_permission_limit ?? null,
          monthly_absence_limit: w.monthly_absence_limit ?? null,
        };
      }
    });
  }

  onSubmit(): void {
    this.loading = true;
    if (this.isEdit && this.workerId) {
      this.workerService.update(this.workerId, this.payload).subscribe(() => {
        this.router.navigate(['/hr/workers']);
      });
    } else {
      this.workerService.create(this.payload).subscribe(() => {
        this.router.navigate(['/hr/workers']);
      });
    }
  }
}
