import { Component, input } from '@angular/core';
import { RequestStatus } from '../../../core/models/index';

const STATUS_CONFIG: Record<RequestStatus, { label: string; css: string; icon: string }> = {
  PENDING:   { label: 'EN REVISIÓN', css: 'badge-pending',   icon: '' },
  APPROVED:  { label: 'APROBADA',    css: 'badge-approved',  icon: '' },
  REJECTED:  { label: 'RECHAZADA',   css: 'badge-rejected',  icon: '' },
  CANCELLED: { label: 'CANCELADA',   css: 'badge-cancelled', icon: '' },
};

const UNKNOWN_STATUS = { label: 'SIN ESTADO', css: 'badge-cancelled', icon: '' };

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="badge" [class]="config().css">
      <span class="badge-dot" aria-hidden="true"></span>
      {{ config().label }}
    </span>
  `,
  styles: [`:host { display: inline-flex; }`],
})
export class StatusBadgeComponent {
  status = input.required<RequestStatus>();
  config = () => STATUS_CONFIG[this.status()] ?? UNKNOWN_STATUS;
}
