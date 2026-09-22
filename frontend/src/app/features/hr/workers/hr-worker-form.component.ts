import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HrWorkerService } from '../../../core/services/hr-worker.service';
import { HrAreaService, HrPositionService } from '../../../core/services/hr-area-position.service';
import { WorkerPhotoComponent } from '../../../shared/components/worker-photo.component';
import { Area, Position, CreateWorkerPayload } from '../../../core/models/index';

@Component({
  selector: 'app-hr-worker-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, WorkerPhotoComponent],
  template: `
    <div class="form-container">
      <div class="form-card">
        <h2>{{ isEdit ? 'Editar Trabajador' : 'Nuevo Trabajador' }}</h2>
        <p class="subtitle">Ingresa la información personal y laboral del empleado.</p>

        @if (error) { <div class="alert alert-error" role="alert">{{ error }}</div> }
        <form (ngSubmit)="onSubmit(form)" #form="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="worker-photo">Foto (JPG, PNG o WEBP, máximo 20 MB)</label>
              <div class="photo-preview"><app-worker-photo [workerId]="workerId" [hasPhoto]="hasPhoto" [preview]="photoPreview" [initials]="payload.name.charAt(0)" /></div>
              <input id="worker-photo" type="file" accept=".jpg,.jpeg,.png,.webp" (change)="selectPhoto($event)" [disabled]="loading" />
            </div>
          </div>
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
              <label for="birth-date">Fecha de nacimiento *</label>
              <input id="birth-date" type="date" [(ngModel)]="payload.birth_date" name="birth_date" required [max]="maximumBirthDate" class="input-control" />
            </div>
            <div class="form-group">
              <label for="worker-type">Tipo de trabajador *</label>
              <select id="worker-type" [(ngModel)]="payload.worker_type" name="worker_type" required class="input-control">
                <option [ngValue]="null" disabled>Selecciona un tipo</option>
                <option value="EMPLEADO">Empleado</option><option value="OBRERO">Obrero</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="hire-date">Fecha de ingreso a la empresa</label>
              <input id="hire-date" type="date" [(ngModel)]="payload.hire_date" name="hire_date" aria-describedby="hire-date-help" class="input-control" />
              <small id="hire-date-help">Opcional. Puedes completarla o corregirla al editar al trabajador.</small>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Área *</label>
              <select [(ngModel)]="payload.area_id" name="area_id" required class="input-control">
                <option [ngValue]="0" disabled>Selecciona un área</option>
                <option *ngFor="let a of selectableAreas" [value]="a.id">{{ a.name }}{{ !a.active ? ' (inactiva)' : '' }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Cargo *</label>
              <select [(ngModel)]="payload.position_id" name="position_id" required class="input-control">
                <option [ngValue]="0" disabled>Selecciona un cargo</option>
                <option *ngFor="let p of selectablePositions" [value]="p.id">{{ p.name }}{{ !p.active ? ' (inactivo)' : '' }}</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input type="text" [(ngModel)]="payload.phone" name="phone" class="input-control" />
            </div>

            <div class="form-group">
              <label>Dirección de residencia</label>
              <input type="text" [(ngModel)]="payload.address" name="address" class="input-control" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Dirección según DNI</label>
              <input type="text" [(ngModel)]="payload.dni_address" name="dni_address" maxlength="255" class="input-control" />
            </div>
            <div class="form-group">
              <label>Teléfono de emergencia</label>
              <input type="tel" [(ngModel)]="payload.emergency_phone" name="emergency_phone" maxlength="30" class="input-control" />
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
                <input type="password" [(ngModel)]="payload.password" name="password" required minlength="6" autocomplete="new-password" aria-describedby="worker-password-help" class="input-control" />
                <small id="worker-password-help">Mínimo 6 caracteres. Puede contener solo números; se ingresa manualmente.</small>
              </div>
            </div>
          } @else {
            <div class="form-row">
              <div class="form-group">
                <label for="new-password">Nueva contraseña (opcional)</label>
                <input id="new-password" type="password" [(ngModel)]="payload.password" name="password" minlength="6" autocomplete="new-password" aria-describedby="new-password-help" class="input-control" />
                <small id="new-password-help">Déjala vacía para conservar la actual. Mínimo 6 caracteres; puede contener solo números. Al cambiarla se cerrarán las sesiones del trabajador.</small>
              </div>
              <div class="form-group">
                <label for="password-confirmation">Confirmar nueva contraseña</label>
                <input id="password-confirmation" type="password" [(ngModel)]="passwordConfirmation" name="password_confirmation" [required]="!!payload.password" autocomplete="new-password" class="input-control" />
              </div>
            </div>
          }

          <div class="form-actions">
            <a routerLink="/hr/workers" class="btn-cancel">Cancelar</a>
            <button type="submit" [disabled]="!form.valid || loading || !payload.area_id || !payload.position_id" class="btn-submit">
              {{ loading ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Trabajador') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .photo-preview { width:96px; height:96px; border-radius:50%; background:var(--color-primary); color:white; }
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
      min-width: 0;
      gap: 0.4rem;
      label { font-size: 0.8rem; font-weight: 700; color: #475569; }
    }
    .input-control {
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
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
export class HrWorkerFormComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private workerService = inject(HrWorkerService);
  private areaService = inject(HrAreaService);
  private positionService = inject(HrPositionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  workerId?: number;
  loading = false;

  error = '';
  passwordConfirmation = '';
  hasPhoto = false;
  photoPreview: string | null = null;
  private originalArea?: number;
  private originalPosition?: number;
  maximumBirthDate = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); })();
  get selectableAreas() { return this.areas.filter(a => a.active || (this.isEdit && a.id === this.originalArea)); }
  get selectablePositions() { return this.positions.filter(p => p.active || (this.isEdit && p.id === this.originalPosition)); }
  areas: Area[] = [];
  positions: Position[] = [];

  payload: CreateWorkerPayload = {
    name: '',
    last_name: '',
    email: '',
    dni: '',
    password: '',
    area_id: 0,
    position_id: 0,
    worker_type: null,
    birth_date: '',
    hire_date: '',
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
    this.areaService.getAll().subscribe(res => { if (res.success && res.data) this.areas = res.data; this.cdr.markForCheck(); });
    this.positionService.getAll().subscribe(res => { if (res.success && res.data) this.positions = res.data; this.cdr.markForCheck(); });
  }

  loadWorker(id: number): void {
    this.workerService.getById(id).subscribe(res => {
      if (res.success && res.data) {
        const w = res.data;
        this.originalArea = w.area?.id;
        this.originalPosition = w.position?.id;
        this.hasPhoto = !!w.has_photo;
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
          dni_address: w.dni_address ?? '',
          emergency_phone: w.emergency_phone ?? '',
          worker_type: w.worker_type ?? null,
          birth_date: w.birth_date ?? '',
          hire_date: w.hire_date ?? '',
          monthly_permission_limit: w.monthly_permission_limit ?? null,
          monthly_absence_limit: w.monthly_absence_limit ?? null,
        };
        this.cdr.markForCheck();
      }
    });
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || this.loading) return;
    if (!/\.(jpe?g|png|webp)$/i.test(file.name) || !file.size || file.size > 20 * 1024 * 1024) {
      this.error = 'Selecciona una imagen JPG, PNG o WEBP de hasta 20 MB.';
      input.value = '';
      return;
    }
    this.error = '';
    if (this.photoPreview) URL.revokeObjectURL(this.photoPreview);
    this.payload.photo = file;
    this.photoPreview = URL.createObjectURL(file);
  }
  ngOnDestroy(): void { if (this.photoPreview) URL.revokeObjectURL(this.photoPreview); }
  onSubmit(form: NgForm): void {
    if (this.loading || !form.valid || !this.payload.area_id || !this.payload.position_id) return;
    if (this.isEdit && this.payload.password && this.payload.password !== this.passwordConfirmation) {
      this.error = 'La confirmación de la contraseña no coincide.';
      return;
    }
    this.loading = true;
    this.error = '';
    const save = this.isEdit && this.workerId
      ? this.workerService.update(this.workerId, { ...this.payload, password_confirmation: this.passwordConfirmation })
      : this.workerService.create(this.payload);
    save.subscribe({
      next: res => {
        this.loading = false;
        if (res.success) this.router.navigate(['/hr/workers']);
        else this.error = res.message;
        this.cdr.markForCheck();
      },
      error: err => {
        this.loading = false;
        this.error = (Object.values(err?.error?.errors ?? {}).flat()[0] as string)
          || err?.error?.message || 'No se pudo guardar el trabajador.';
        this.cdr.markForCheck();
      },
    });
  }
}
