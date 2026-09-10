import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HrDashboardService } from '../../../core/services/hr-services';
import { HrDashboardStats } from '../../../core/models/index';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/ui.components';

@Component({
  selector: 'app-hr-dashboard',
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
  templateUrl: './hr-dashboard.component.html',
  styleUrl: './hr-dashboard.component.scss',
})
export class HrDashboardComponent implements OnInit {
  private svc = inject(HrDashboardService);

  loading = signal(true);
  stats   = signal<HrDashboardStats | null>(null);

  ngOnInit(): void {
    this.svc.getStats().subscribe({
      next: res => { this.stats.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}
