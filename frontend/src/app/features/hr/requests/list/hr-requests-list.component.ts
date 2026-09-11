import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HrRequestService } from '../../../../core/services/hr-services';
import { LeaveRequest, RequestStatus } from '../../../../core/models/index';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent, EmptyStateComponent } from '../../../../shared/components/ui.components';

@Component({
  selector: 'app-hr-requests-list',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './hr-requests-list.component.html',
  styleUrl: './hr-requests-list.component.scss',
})
export class HrRequestsListComponent implements OnInit {
  private svc = inject(HrRequestService);
  private fb  = inject(FormBuilder);

  loading  = signal(true);
  requests = signal<LeaveRequest[]>([]);

  filterForm = this.fb.group({
    search:   [''],
    status:   [''],
  });

  get filtered(): LeaveRequest[] {
    const { search, status } = this.filterForm.getRawValue();
    return this.requests().filter(r => {
      const matchSearch = !search || r.employee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.category.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !status || r.status === status;
      return matchSearch && matchStatus;
    });
  }

  ngOnInit(): void {
    this.svc.getAll().subscribe({
      next: res => { this.requests.set(res.data ?? []); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }
}
