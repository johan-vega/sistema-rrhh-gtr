import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestService } from '../../../../core/services/request.service';
import { DocumentService } from '../../../../core/services/document.service';
import { LeaveRequest } from '../../../../core/models/index';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/ui.components';

@Component({
  selector: 'app-worker-request-detail',
  imports: [RouterLink, StatusBadgeComponent, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './worker-request-detail.component.html',
  styleUrl: './worker-request-detail.component.scss',
})
export class WorkerRequestDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private svc    = inject(RequestService);
  private documents = inject(DocumentService);

  loading       = signal(true);
  cancelling    = signal(false);
  request       = signal<LeaveRequest | null>(null);
  showConfirm   = signal(false);
  documentError = signal('');

  get canCancel() {
    const s = this.request()?.status;
    return s === 'PENDING';
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

  formatDateTime(d: string): string {
    return new Date(d).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  confirmCancel(): void { this.showConfirm.set(true); }
  dismissConfirm(): void { this.showConfirm.set(false); }

  doCancel(): void {
    this.showConfirm.set(false);
    this.cancelling.set(true);
    this.svc.cancel(this.request()!.id).subscribe({
      next: () => this.router.navigate(['/worker/requests']),
      error: ()  => this.cancelling.set(false),
    });
  }

  openDocument(): void {
    const url = this.request()?.document_url;
    if (!url) return;
    const tab = window.open('', '_blank');
    this.documentError.set('');
    this.documents.get(url).subscribe({
      next: file => {
        const objectUrl = URL.createObjectURL(file);
        if (tab) tab.location.href = objectUrl;
        else {
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = 'documento-adjunto';
          link.click();
        }
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      },
      error: () => { tab?.close(); this.documentError.set('No se pudo abrir el documento adjunto. Inténtalo nuevamente.'); },
    });
  }
}
