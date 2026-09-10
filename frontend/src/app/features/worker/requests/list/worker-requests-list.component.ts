import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequestService } from '../../../../core/services/request.service';
import { LeaveRequest, RequestStatus } from '../../../../core/models/index';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent, EmptyStateComponent } from '../../../../shared/components/ui.components';

@Component({
  selector: 'app-worker-requests-list',
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './worker-requests-list.component.html',
  styleUrl: './worker-requests-list.component.scss',
})
export class WorkerRequestsListComponent implements OnInit {
  private svc = inject(RequestService);

  loading  = signal(true);
  requests = signal<LeaveRequest[]>([]);
  filter   = signal<RequestStatus | 'ALL'>('ALL');

  get filtered() {
    const f = this.filter();
    return f === 'ALL' ? this.requests() : this.requests().filter(r => r.status === f);
  }

  filters: { value: RequestStatus | 'ALL'; label: string }[] = [
    { value: 'ALL',       label: 'Todas' },
    { value: 'PENDING',   label: 'En revisión' },
    { value: 'APPROVED',  label: 'Aprobadas' },
    { value: 'REJECTED',  label: 'Rechazadas' },
    { value: 'CANCELLED', label: 'Canceladas' },
  ];

  ngOnInit(): void {
    this.svc.getAll().subscribe({
      next: res => { this.requests.set(res.data ?? []); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  setFilter(f: RequestStatus | 'ALL'): void { this.filter.set(f); }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
