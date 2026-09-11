import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HrProfile, HrProfileService } from '../../../core/services/hr-profile.service';
import { LoadingSpinnerComponent } from '../../../shared/components/ui.components';

@Component({
  selector: 'app-hr-profile',
  imports: [ReactiveFormsModule, LoadingSpinnerComponent],
  templateUrl: './hr-profile.component.html',
  styleUrl: './hr-profile.component.scss',
})
export class HrProfileComponent implements OnInit {
  private service = inject(HrProfileService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal('');
  profile = signal<HrProfile | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    current_password: [''],
    password: ['', [Validators.minLength(8)]],
    password_confirmation: [''],
  });

  ngOnInit(): void {
    this.service.get().subscribe({
      next: response => {
        this.profile.set(response.data);
        this.form.patchValue({ name: response.data.name, email: response.data.email });
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudo cargar tu perfil.'); this.loading.set(false); },
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    const raw = this.form.getRawValue();
    if (raw.password && raw.password !== raw.password_confirmation) {
      this.error.set('La confirmación de la contraseña no coincide.');
      return;
    }

    this.saving.set(true); this.saved.set(false); this.error.set('');
    const payload = {
      name: raw.name!, email: raw.email!,
      ...(raw.password ? {
        current_password: raw.current_password || undefined,
        password: raw.password,
        password_confirmation: raw.password_confirmation || undefined,
      } : {}),
    };
    this.service.update(payload).subscribe({
      next: response => {
        this.saving.set(false);
        this.profile.set(response.data);
        this.form.patchValue({ current_password: '', password: '', password_confirmation: '' });
        this.saved.set(true);
      },
      error: err => {
        this.saving.set(false);
        const messages = err?.error?.errors;
        this.error.set(messages ? Object.values(messages).flat().join(' ') : err?.error?.message || 'No se pudo guardar el perfil.');
      },
    });
  }
}
