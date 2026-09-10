import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { User } from '../../../core/models/index';
import { LoadingSpinnerComponent } from '../../../shared/components/ui.components';

@Component({
  selector: 'app-worker-profile',
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <h1 class="page-title">Mi Perfil</h1>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (user()) {
        @if (saved()) {
          <div class="alert alert-success">✅ Cambios guardados correctamente.</div>
        }
        @if (error()) {
          <div class="alert alert-error">❌ {{ error() }}</div>
        }

        <!-- Datos de solo lectura -->
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header"><h2>Información personal</h2></div>
          <div class="card-body">
            <div class="avatar-row">
              <div class="profile-avatar">{{ user()!.name.charAt(0) }}</div>
              <div>
                <p class="profile-name">{{ user()!.full_name }}</p>
                <p class="profile-role">Trabajador</p>
              </div>
            </div>
            <div class="divider"></div>
            <div class="detail-list">
              <div class="detail-row">
                <span class="detail-label">Nombres</span>
                <span class="detail-value">{{ user()!.name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Apellidos</span>
                <span class="detail-value">{{ user()!.last_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">DNI</span>
                <span class="detail-value">{{ user()!.dni }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Área</span>
                <span class="detail-value">{{ user()!.area?.name ?? '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Cargo</span>
                <span class="detail-value">{{ user()!.position?.name ?? '—' }}</span>
              </div>
            </div>
            <div class="readonly-notice">
              🔒 Estos datos solo pueden ser modificados por RRHH.
            </div>
          </div>
        </div>

        <!-- Datos editables -->
        <div class="card">
          <div class="card-header"><h2>Datos de contacto</h2></div>
          <div class="card-body">
            <form [formGroup]="form" (ngSubmit)="onSave()">
              <div class="form-group">
                <label class="form-label" for="address">Dirección</label>
                <input id="address" type="text" class="form-control" formControlName="address"
                  placeholder="Tu dirección de residencia" />
              </div>
              <div class="form-group">
                <label class="form-label" for="phone">Teléfono</label>
                <input id="phone" type="tel" class="form-control" formControlName="phone"
                  placeholder="Tu número de teléfono" />
              </div>
              <button id="btn-guardar-perfil" type="submit" class="btn btn-primary btn-full" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> Guardando... }
                @else { Guardar cambios }
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .avatar-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
    .profile-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--color-accent); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: var(--font-weight-bold); flex-shrink: 0;
    }
    .profile-name { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
    .profile-role { font-size: var(--font-size-sm); color: var(--color-text-muted); }
    .readonly-notice {
      margin-top: 1rem; font-size: var(--font-size-sm);
      color: var(--color-text-muted); font-style: italic;
    }
  `],
})
export class WorkerProfileComponent implements OnInit {
  private svc = inject(ProfileService);
  private fb  = inject(FormBuilder);

  loading = signal(true);
  saving  = signal(false);
  saved   = signal(false);
  error   = signal('');
  user    = signal<User | null>(null);

  form = this.fb.group({
    address: [''],
    phone:   [''],
  });

  ngOnInit(): void {
    this.svc.get().subscribe({
      next: res => {
        this.user.set(res.data);
        this.form.patchValue({ address: res.data.address ?? '', phone: res.data.phone ?? '' });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSave(): void {
    if (this.saving()) return;
    this.saving.set(true); this.saved.set(false); this.error.set('');
    const raw = this.form.getRawValue();
    const payload = {
      address: raw.address || undefined,
      phone: raw.phone || undefined,
    };
    this.svc.update(payload).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) { this.user.set(res.data); this.saved.set(true); setTimeout(() => this.saved.set(false), 3000); }
        else this.error.set(res.message);
      },
      error: err => { this.saving.set(false); this.error.set(err?.error?.message || 'Error al guardar.'); },
    });
  }
}
