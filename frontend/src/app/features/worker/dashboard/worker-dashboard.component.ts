import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RequestService } from '../../../core/services/request.service';
import { LeaveRequest } from '../../../core/models/index';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/ui.components';

@Component({
  selector: 'app-worker-dashboard',
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
  templateUrl: './worker-dashboard.component.html',
  styleUrl: './worker-dashboard.component.scss',
})
export class WorkerDashboardComponent implements OnInit {
  auth    = inject(AuthService);
  private reqSvc = inject(RequestService);

  loading  = signal(true);
  requests = signal<LeaveRequest[]>([]);

  get recentRequests() { return this.requests().slice(0, 3); }
  get pendingCount()   { return this.requests().filter(r => r.status === 'PENDING').length; }
  get approvedCount()  { return this.requests().filter(r => r.status === 'APPROVED').length; }

  ngOnInit(): void {
    this.reqSvc.getAll().subscribe({
      next: res => { this.requests.set(res.data ?? []); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}
