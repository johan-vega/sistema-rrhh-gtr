import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private route = inject(ActivatedRoute);
  pwa           = inject(PwaService);

  loading      = signal(false);
  error        = signal('');
  showPassword = signal(false);
  sessionExpired = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(3)]],
    remember:  [false],
  });

  ngOnInit(): void {
    this.sessionExpired.set(this.route.snapshot.queryParamMap.has('expired'));
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set('');
    this.loading.set(true);

    const { email, password, remember } = this.form.getRawValue();

    this.auth.login({ email: email!, password: password! }, Boolean(remember)).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.auth.navigateByRole();
        } else {
          this.error.set(res.message || 'Credenciales incorrectas. Intenta de nuevo.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.message || 'No se pudo conectar. Verifica tu conexión.',
        );
      },
    });
  }

  get emailCtrl() { return this.form.get('email')!; }
  get passCtrl()  { return this.form.get('password')!; }
}
