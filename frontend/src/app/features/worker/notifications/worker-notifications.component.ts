import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/index';
import { LoadingSpinnerComponent, EmptyStateComponent } from '../../../shared/components/ui.components';

@Component({
  selector: 'app-worker-notifications',
  imports: [RouterLink, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Notificaciones</h1>
        @if (unread() > 0) {
          <button class="btn btn-ghost btn-sm" (click)="markAllRead()">
            ✓ Marcar todas
          </button>
        }
      </div>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (notifications().length === 0) {
        <app-empty-state icon="🔔" title="Sin notificaciones" subtitle="Aquí aparecerán los cambios en tus solicitudes." />
      } @else {
        <div class="list-container">
          @for (n of notifications(); track n.id) {
            <div class="notif-card card" [class.unread]="!n.read" (click)="markRead(n)">
              <div class="card-body" style="padding:1rem 1.25rem">
                <div class="notif-header">
                  <span class="notif-title">{{ n.title }}</span>
                  @if (!n.read) { <span class="notif-badge">Nuevo</span> }
                </div>
                <p class="notif-message">{{ n.message }}</p>
                <p class="notif-time">{{ formatTime(n.created_at) }}</p>
                @if (n.request_id) {
                  <a [routerLink]="['/worker/requests', n.request_id]" class="btn btn-ghost btn-sm" style="margin-top:0.5rem">
                    Ver solicitud →
                  </a>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; .page-title { margin-bottom: 0; } }
    .notif-card { cursor: pointer; transition: all var(--transition-fast); &:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); } }
    .notif-card.unread { border-left: 4px solid var(--color-accent); }
    .notif-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.375rem; }
    .notif-title { font-weight: var(--font-weight-semibold); }
    .notif-badge { background: var(--color-accent); color: white; font-size: var(--font-size-xs); padding: 0.1rem 0.5rem; border-radius: var(--radius-full); }
    .notif-message { font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.5; }
    .notif-time { font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 0.375rem; }
  `],
})
export class WorkerNotificationsComponent implements OnInit {
  private svc = inject(NotificationService);

  loading       = signal(true);
  notifications = signal<AppNotification[]>([]);
  unread        = () => this.notifications().filter(n => !n.read).length;

  ngOnInit(): void {
    this.svc.getWorkerNotifications().subscribe({
      next: res => { this.notifications.set(res.data ?? []); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  markRead(n: AppNotification): void {
    if (n.read) return;
    this.svc.markRead(n.id).subscribe(() => {
      this.notifications.update(list => list.map(x => x.id === n.id ? { ...x, read: true } : x));
    });
  }

  markAllRead(): void {
    this.svc.markAllRead().subscribe(() => {
      this.notifications.update(list => list.map(x => ({ ...x, read: true })));
    });
  }

  formatTime(d: string): string {
    return new Date(d).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
