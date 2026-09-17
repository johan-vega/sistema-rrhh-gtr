import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HrCategoryService } from '../../../core/services/hr-services';
import { HrWorkerService } from '../../../core/services/hr-worker.service';
import { HrAreaService } from '../../../core/services/hr-area-position.service';
import { ReportService } from '../../../core/services/report.service';
import { Area, HrReportFilters, HrRequestReport, RequestCategory, RequestStatus, Worker } from '../../../core/models/index';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent, LoadingSpinnerComponent } from '../../../shared/components/ui.components';

@Component({
  selector: 'app-hr-reports',
  imports: [CommonModule, ReactiveFormsModule, StatusBadgeComponent, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './hr-reports.component.html',
  styleUrl: './hr-reports.component.scss',
})
export class HrReportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reports = inject(ReportService);
  private workersService = inject(HrWorkerService);
  private categoriesService = inject(HrCategoryService);
  private areasService = inject(HrAreaService);

  workers = signal<Worker[]>([]);
  categories = signal<RequestCategory[]>([]);
  areas = signal<Area[]>([]);
  report = signal<HrRequestReport | null>(null);
  loading = signal(true);
  exporting = signal(false);
  error = signal('');
  private appliedFilters: HrReportFilters = {};

  filterForm = this.fb.group({
    from: [''],
    to: [''],
    worker_id: [''],
    area_id: [''],
    category_id: [''],
    status: [''],
  });

  ngOnInit(): void {
    forkJoin({ workers: this.workersService.getAll(), categories: this.categoriesService.getAll(), areas: this.areasService.getAll() }).subscribe({
      next: data => {
        this.workers.set(data.workers.data ?? []);
        this.categories.set(data.categories.data ?? []);
        this.areas.set(data.areas.data ?? []);
      },
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const filters = this.filters();
    this.reports.getRequestReport(filters).subscribe({
      next: response => {
        this.report.set(response.data);
        this.appliedFilters = filters;
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el reporte. Verifica la conexión e inténtalo nuevamente.');
        this.loading.set(false);
      },
    });
  }

  useCurrentMonth(): void {
    this.filterForm.patchValue({ from: this.firstDayOfMonth(), to: this.today() });
    this.load();
  }

  useAllHistory(): void {
    this.filterForm.patchValue({ from: '', to: '' });
    this.load();
  }

  exportExcel(): void {
    if (this.loading() || this.exporting() || !this.report()) return;
    this.exporting.set(true);
    this.error.set('');
    this.reports.exportRequestReport(this.appliedFilters).subscribe({
      next: file => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = `reporte-solicitudes-${this.today()}.xlsx`;
        link.click();
        URL.revokeObjectURL(link.href);
        this.exporting.set(false);
      },
      error: () => {
        this.error.set('No se pudo exportar el archivo Excel. Inténtalo nuevamente.');
        this.exporting.set(false);
      },
    });
  }

  formatDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private filters(): HrReportFilters {
    const form = this.filterForm.getRawValue();
    return {
      from: form.from ?? '',
      to: form.to ?? '',
      worker_id: form.worker_id ? Number(form.worker_id) : '',
      area_id: form.area_id ? Number(form.area_id) : '',
      category_id: form.category_id ? Number(form.category_id) : '',
      status: (form.status ?? '') as RequestStatus | '',
    };
  }

  private today(): string {
    return this.localDate(new Date());
  }

  private firstDayOfMonth(): string {
    const date = new Date();
    return this.localDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  private localDate(date: Date): string {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }
}
