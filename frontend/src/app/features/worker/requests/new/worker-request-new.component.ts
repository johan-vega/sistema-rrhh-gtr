import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { RequestService } from '../../../../core/services/request.service';
import { RequestCategory } from '../../../../core/models/index';

@Component({
  selector: 'app-worker-request-new',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './worker-request-new.component.html',
  styleUrl: './worker-request-new.component.scss',
})
export class WorkerRequestNewComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private catSvc   = inject(CategoryService);
  private reqSvc   = inject(RequestService);
  private router   = inject(Router);

  categories       = signal<RequestCategory[]>([]);
  selectedCategory = signal<RequestCategory | null>(null);
  loading          = signal(false);
  success          = signal(false);
  error            = signal('');
  selectedFile     = signal<File | null>(null);
  dateWarning      = signal('');
  today            = new Date().toISOString().split('T')[0];

  form = this.fb.group({
    category_id: this.fb.control<number | null>(null, Validators.required),
    start_date:  ['', Validators.required],
    end_date:    ['', Validators.required],
    reason:      ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit(): void {
    this.catSvc.getAll().subscribe(res => this.categories.set(res.data ?? []));

    this.form.get('category_id')!.valueChanges.subscribe(id => {
      const cat = this.categories().find(c => c.id === Number(id)) ?? null;
      this.selectedCategory.set(cat);
      this.checkAdvanceDays();
    });

    this.form.get('start_date')!.valueChanges.subscribe(() => this.checkAdvanceDays());
  }

  checkAdvanceDays(): void {
    const cat = this.selectedCategory();
    const startStr = this.form.get('start_date')!.value;
    if (!cat || !startStr) { this.dateWarning.set(''); return; }

    const start = new Date(startStr + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((start.getTime() - today.getTime()) / 86400000);

    if (cat.is_absence && diffDays < 0) {
      const maximumPastDays = cat.maximum_past_days ?? 0;
      this.dateWarning.set(
        diffDays < -maximumPastDays
          ? `La justificación puede registrarse hasta ${maximumPastDays} día(s) después de la falta.`
          : `Puedes justificar una falta ocurrida hasta hace ${maximumPastDays} día(s).`,
      );
    } else if (diffDays < cat.minimum_advance_days) {
      this.dateWarning.set(
        `Esta categoría requiere al menos ${cat.minimum_advance_days} día(s) de anticipación.`
      );
    } else {
      this.dateWarning.set('');
    }
  }

  onFileChange(event: Event): void {
    if (this.loading()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(extension ?? '')) {
      this.error.set('Solo se permiten archivos PDF, JPG, PNG, WEBP o HEIC.');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('El archivo no debe superar 10 MB.');
      input.value = '';
      return;
    }
    if (file.size === 0) {
      this.error.set('El archivo está vacío. Selecciona otro documento.');
      input.value = '';
      return;
    }
    this.error.set('');
    this.selectedFile.set(file);
  }

  removeFile(input: HTMLInputElement): void {
    if (this.loading()) return;
    this.selectedFile.set(null);
    input.value = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmit(): void {
    if (this.loading()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Completa los campos obligatorios antes de enviar la solicitud.');
      return;
    }

    const raw = this.form.getRawValue();
    const cat = this.categories().find(item => item.id === Number(raw.category_id));
    if (!cat) {
      this.error.set('Selecciona un tipo de solicitud disponible.');
      return;
    }
    if (cat?.requires_document && !this.selectedFile()) {
      this.error.set('Esta categoría requiere adjuntar un documento.');
      return;
    }
    this.error.set('');
    this.loading.set(true);

    this.reqSvc.create({
      category_id: cat.id,
      start_date: raw.start_date!,
      end_date: raw.end_date!,
      reason: raw.reason!,
      document: this.selectedFile() ?? undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) this.router.navigate(['/worker/requests', res.data.id]);
        else this.error.set(res.message || 'Error al enviar la solicitud.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.getRequestError(err));
      },
    });
  }

  get categoryCtrl()  { return this.form.get('category_id')!; }
  get startCtrl()     { return this.form.get('start_date')!; }
  get endCtrl()       { return this.form.get('end_date')!; }
  get reasonCtrl()    { return this.form.get('reason')!; }

  get minimumSelectableDate(): string {
    const category = this.selectedCategory();
    if (!category?.is_absence) return this.today;
    const date = new Date();
    date.setDate(date.getDate() - (category.maximum_past_days ?? 0));
    return date.toISOString().split('T')[0];
  }

  private getRequestError(error: any): string {
    if (error instanceof Error && !(error instanceof HttpErrorResponse)) return error.message;
    const errors = error?.error?.errors as Record<string, string[]> | undefined;
    const message = Object.values(errors ?? {}).flat()[0] ?? error?.error?.message;
    const safeMessages: Record<string, string> = {
      'validation.required': 'Completa todos los campos obligatorios antes de enviar la solicitud.',
      'validation.uploaded': 'No se pudo cargar el archivo. Verifica que no supere 10 MB e inténtalo nuevamente.',
      'validation.mimes': 'El documento debe ser PDF, JPG, PNG, WEBP, HEIC o HEIF.',
    };

    return safeMessages[message ?? ''] ?? message ?? 'No se pudo enviar. Revisa los datos.';
  }
}
