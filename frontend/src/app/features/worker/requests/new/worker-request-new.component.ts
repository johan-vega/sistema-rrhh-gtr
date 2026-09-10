import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { RequestService } from '../../../../core/services/request.service';
import { RequestCategory } from '../../../../core/models/index';

@Component({
  selector: 'app-worker-request-new',
  imports: [ReactiveFormsModule],
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
    category_id: ['', Validators.required],
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

    if (diffDays < cat.minimum_advance_days) {
      this.dateWarning.set(
        `Esta categoría requiere al menos ${cat.minimum_advance_days} día(s) de anticipación.`
      );
    } else {
      this.dateWarning.set('');
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      this.error.set('Solo se permiten archivos PDF, JPG o PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('El archivo no debe superar 5 MB.');
      return;
    }
    this.error.set('');
    this.selectedFile.set(file);
  }

  removeFile(): void { this.selectedFile.set(null); }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    const cat = this.selectedCategory();
    if (cat?.requires_document && !this.selectedFile()) {
      this.error.set('Esta categoría requiere adjuntar un documento.');
      return;
    }
    this.error.set('');
    this.loading.set(true);

    const raw = this.form.getRawValue();
    this.reqSvc.create({
      category_id: Number(raw.category_id),
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
        this.error.set(err?.error?.message || 'No se pudo enviar. Revisa los datos.');
      },
    });
  }

  get categoryCtrl()  { return this.form.get('category_id')!; }
  get startCtrl()     { return this.form.get('start_date')!; }
  get endCtrl()       { return this.form.get('end_date')!; }
  get reasonCtrl()    { return this.form.get('reason')!; }
}
