import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HrDashboardService } from '../../../core/services/hr-services';
import { HrAreaService } from '../../../core/services/hr-area-position.service';
import { HrWorkerService } from '../../../core/services/hr-worker.service';
import { ReportService } from '../../../core/services/report.service';
import { Area, HrDashboardStats, HrRequestAnalytics, HrReportFilters, Worker } from '../../../core/models/index';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/ui.components';

@Component({
  selector: 'app-hr-dashboard',
  imports: [RouterLink, ReactiveFormsModule, StatusBadgeComponent, LoadingSpinnerComponent],
  templateUrl: './hr-dashboard.component.html',
  styleUrl: './hr-dashboard.component.scss',
})
export class HrDashboardComponent implements OnInit {
  private svc = inject(HrDashboardService);
  private reports = inject(ReportService);
  private workersService = inject(HrWorkerService);
  private areasService = inject(HrAreaService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  stats   = signal<HrDashboardStats | null>(null);
  analytics = signal<HrRequestAnalytics | null>(null);
  workers = signal<Worker[]>([]);
  areas = signal<Area[]>([]);
  chartType = signal<'bar' | 'pie'>('bar');
  analyticsLoading = signal(true);

  analyticsForm = this.fb.group({
    from: [this.firstDayOfMonth()],
    to: [this.lastDayOfMonth()],
    worker_id: [''],
    area_id: [''],
  });

  ngOnInit(): void {
    this.svc.getStats().subscribe({
      next: res => { this.stats.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
    forkJoin({ workers: this.workersService.getAll(), areas: this.areasService.getAll() }).subscribe({
      next: data => { this.workers.set(data.workers.data ?? []); this.areas.set(data.areas.data ?? []); },
    });
    this.loadAnalytics();
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  loadAnalytics(): void {
    this.analyticsLoading.set(true);
    this.reports.getRequestAnalytics(this.analyticsFilters()).subscribe({
      next: response => { this.analytics.set(response.data); this.analyticsLoading.set(false); },
      error: () => this.analyticsLoading.set(false),
    });
  }

  setChart(type: 'bar' | 'pie'): void { this.chartType.set(type); }

  barPercent(value: number): number {
    const max = Math.max(...(this.analytics()?.series.map(item => item.value) ?? [0]), 1);
    return Math.max(value / max * 100, value > 0 ? 8 : 0);
  }

  pieStyle(): string {
    const data = this.analytics();
    if (!data?.total) return 'conic-gradient(#e2e8f0 0 100%)';
    const approvedPercent = data.approved / data.total * 100;
    return `conic-gradient(#10B981 0 ${approvedPercent}%, #EF4444 ${approvedPercent}% 100%)`;
  }

  private analyticsFilters(): HrReportFilters {
    const values = this.analyticsForm.getRawValue();
    return { from: values.from ?? '', to: values.to ?? '', worker_id: values.worker_id ? Number(values.worker_id) : '', area_id: values.area_id ? Number(values.area_id) : '' };
  }

  private today(): string { return this.localDate(new Date()); }

  private firstDayOfMonth(): string {
    const date = new Date();
    return this.localDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  private lastDayOfMonth(): string {
    const date = new Date();
    return this.localDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  }

  private localDate(date: Date): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
}
