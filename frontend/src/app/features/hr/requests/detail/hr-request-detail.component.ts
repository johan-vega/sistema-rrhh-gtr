import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HrRequestService } from '../../../../core/services/hr-services';
import { DocumentService } from '../../../../core/services/document.service';
import { AreaAvailabilityDate, AreaAvailabilitySummary, LeaveRequest } from '../../../../core/models/index';
import { Subscription } from 'rxjs';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/ui.components';

@Component({
  selector: 'app-hr-request-detail',
  imports: [CommonModule, RouterLink, FormsModule, StatusBadgeComponent, ConfirmDialogComponent, LoadingSpinnerComponent],
  templateUrl: './hr-request-detail.component.html',
  styleUrl: './hr-request-detail.component.scss',
})
export class HrRequestDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private svc = inject(HrRequestService);
  private documents = inject(DocumentService);

  loading = signal(true);
  processing = signal(false);
  request = signal<LeaveRequest | null>(null);
  showApprove = signal(false);
  showReject = signal(false);
  showDelete = signal(false);
  deleteError = signal('');
  observation = '';
  documentError = signal('');
  availability = signal<AreaAvailabilitySummary | null>(null);
  availabilityLoading = signal(false);
  availabilityError = signal('');
  availabilityMonth = signal('');
  selectedDate = signal('');
  readonly weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  private availabilitySubscription?: Subscription;

  readonly visibleRange = computed(() => {
    const request = this.request();
    const month = this.availabilityMonth();
    if (!request || !month) return null;
    const [year, number] = month.split('-').map(Number);
    const lastDay = new Date(year, number, 0).getDate();
    return {
      from: request.start_date > `${month}-01` ? request.start_date : `${month}-01`,
      to: request.end_date < `${month}-${lastDay}` ? request.end_date : `${month}-${lastDay}`,
    };
  });
  readonly monthLabel = computed(() => this.availabilityMonth()
    ? new Date(`${this.availabilityMonth()}-01T00:00:00`).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
    : '');
  readonly calendarDays = computed(() => {
    const month = this.availabilityMonth();
    if (!month) return [];
    const [year, number] = month.split('-').map(Number);
    const offset = new Date(year, number - 1, 1).getDay();
    const count = new Date(year, number, 0).getDate();
    const dates = new Map(this.availability()?.dates.map(day => [day.date, day]) ?? []);
    return Array.from({ length: offset + count }, (_, index) => {
      if (index < offset) return null;
      const day = index - offset + 1;
      const date = `${month}-${String(day).padStart(2, '0')}`;
      return { date, day, availability: dates.get(date) };
    });
  });
  readonly selectedAvailability = computed(() => this.availability()?.dates.find(day => day.date === this.selectedDate()));
  readonly availabilityMessage = computed(() => {
    const summary = this.availability();
    if (!summary || summary.is_exempt) return '';
    if (summary.dates.some(day => !day.available)) return 'Una o más fechas del periodo ya alcanzaron el límite configurado para el área.';
    if (summary.dates.some(day => this.isNearLimit(day))) return 'El área se encuentra cerca del límite en algunas fechas.';
    return 'No se detectan conflictos de cupo para este periodo.';
  });

  get isActionable() {
    return this.request()?.status === 'PENDING';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.svc.getById(id).subscribe({
      next: res => {
        this.request.set(res.data);
        this.loading.set(false);
        if (this.isActionable) {
          this.availabilityMonth.set(res.data.start_date.slice(0, 7));
          this.loadAvailability();
        }
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void { this.availabilitySubscription?.unsubscribe(); }

  loadAvailability(): void {
    const request = this.request();
    const range = this.visibleRange();
    if (!request || !range) return;
    // Al cambiar de mes no mostramos resultados anteriores como si fueran actuales.
    this.availabilitySubscription?.unsubscribe();
    this.availability.set(null);
    this.availabilityError.set('');
    this.availabilityLoading.set(true);
    this.selectedDate.set(range.from);
    this.availabilitySubscription = this.svc.getAvailability(request.id, range.from, range.to).subscribe({
      next: res => { this.availability.set(res.data); this.availabilityLoading.set(false); },
      error: () => {
        this.availabilityLoading.set(false);
        this.availabilityError.set('No se pudo consultar la disponibilidad. Inténtalo nuevamente.');
      },
    });
  }

  changeAvailabilityMonth(delta: number): void {
    const request = this.request();
    if (!request) return;
    const [year, number] = this.availabilityMonth().split('-').map(Number);
    const date = new Date(year, number - 1 + delta, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (month < request.start_date.slice(0, 7) || month > request.end_date.slice(0, 7)) return;
    this.availabilityMonth.set(month);
    this.loadAvailability();
  }

  isNearLimit(day: AreaAvailabilityDate): boolean {
    // Amarillo significa que queda un cupo; un área vacía permanece verde.
    return day.available && day.limit !== null && day.approved_count > 0 && day.approved_count === day.limit - 1;
  }

  availabilityStatus(day: AreaAvailabilityDate): string {
    if (this.availability()?.is_exempt) return 'Informativo · solicitud exenta';
    if (!day.available) return 'Tope alcanzado';
    return this.isNearLimit(day) ? 'Cerca del límite' : 'Disponible';
  }

  dayDescription(day: AreaAvailabilityDate): string {
    return `${this.formatDate(day.date)}: ${day.approved_count} / ${day.limit ?? 'sin límite'} permisos aprobados. ${this.availabilityStatus(day)}.`;
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  confirmApprove(): void { this.showApprove.set(true); }

  deleteRequest(): void {
    const request = this.request();
    if (!request || this.processing()) return;
    this.showDelete.set(false);
    this.processing.set(true);
    this.deleteError.set('');
    this.svc.deleteRequest(request.id).subscribe({
      next: () => { this.processing.set(false); this.router.navigate(['/hr/requests']); },
      error: err => { this.processing.set(false); this.deleteError.set(err.error?.message || 'No se pudo confirmar la eliminación de la solicitud. Actualiza la página antes de reintentar.'); },
    });
  }
  confirmReject(): void { this.showReject.set(true); }
  dismissDialogs(): void { this.showApprove.set(false); this.showReject.set(false); }

  doApprove(): void {
    this.dismissDialogs();
    this.processing.set(true);
    this.svc.approve(this.request()!.id).subscribe({
      next: res => { this.request.set(res.data); this.processing.set(false); },
      error: () => this.processing.set(false),
    });
  }

  doReject(obs: string | undefined): void {
    if (!obs?.trim()) return;
    this.dismissDialogs();
    this.processing.set(true);
    this.svc.reject(this.request()!.id, { observation: obs }).subscribe({
      next: res => { this.request.set(res.data); this.processing.set(false); },
      error: () => this.processing.set(false),
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
          link.download = this.request()?.document_name || 'documento-adjunto';
          link.click();
        }
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      },
      error: () => { tab?.close(); this.documentError.set('No se pudo abrir el documento adjunto. Inténtalo nuevamente.'); },
    });
  }
  downloadDocument(): void {
    const url = this.request()?.document_url;
    if (!url) return;

    this.documentError.set('');

    this.documents.get(url).subscribe({
      next: file => {
        const objectUrl = URL.createObjectURL(file);

        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = this.request()?.document_name || 'documento-adjunto';
        document.body.appendChild(link);

        link.click();
        link.remove();

        URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        this.documentError.set(
          'No se pudo descargar el documento adjunto.'
        );
      },
    });
  }
}
