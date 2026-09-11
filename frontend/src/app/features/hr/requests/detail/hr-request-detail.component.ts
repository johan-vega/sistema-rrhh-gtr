import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HrRequestService } from '../../../../core/services/hr-services';
import { LeaveRequest } from '../../../../core/models/index';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/ui.components';

@Component({
  selector: 'app-hr-request-detail',
  imports: [CommonModule, RouterLink, FormsModule, StatusBadgeComponent, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './hr-request-detail.component.html',
  styleUrl: './hr-request-detail.component.scss',
})
export class HrRequestDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private svc    = inject(HrRequestService);

  loading       = signal(true);
  processing    = signal(false);
  request       = signal<LeaveRequest | null>(null);
  showApprove   = signal(false);
  showReject    = signal(false);
  observation   = '';

  get isActionable() {
    return this.request()?.status === 'PENDING';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getById(id).subscribe({
      next: res => { this.request.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  confirmApprove(): void { this.showApprove.set(true); }
  confirmReject():  void { this.showReject.set(true); }
  dismissDialogs(): void { this.showApprove.set(false); this.showReject.set(false); }

  doApprove(): void {
    this.dismissDialogs();
    this.processing.set(true);
    this.svc.approve(this.request()!.id).subscribe({
      next: res => { this.request.set(res.data); this.processing.set(false); },
      error: ()  => this.processing.set(false),
    });
  }

  doReject(obs: string | undefined): void {
    if (!obs?.trim()) return;
    this.dismissDialogs();
    this.processing.set(true);
    this.svc.reject(this.request()!.id, { observation: obs }).subscribe({
      next: res => { this.request.set(res.data); this.processing.set(false); },
      error: ()  => this.processing.set(false),
    });
  }
}
