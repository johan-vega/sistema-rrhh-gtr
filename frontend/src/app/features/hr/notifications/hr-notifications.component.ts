import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/index';

@Component({
  selector: 'app-hr-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-container">
      <div class="header-section">
        <div>
          <h2>Notificaciones del Sistema (RRHH)</h2>
          <p>Alertas y actualizaciones sobre solicitudes de los trabajadores.</p>
        </div>
        <button (click)="markAllAsRead()" class="btn-read">Marcar todas leídas</button>
      </div>

      <div class="notif-list">
        <div 
          *ngFor="let n of notifications()" 
          class="notif-card"
          [class.read]="n.read"
        >
          <div class="notif-icon">
            
          </div>

          <div class="notif-body">
            <div class="notif-header">
              <h4>{{ n.title }}</h4>
              <span class="time-text">{{ n.created_at | date:'short' }}</span>
            </div>
            <p>{{ n.message }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-container {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
      p { color: #64748b; font-size: 0.88rem; margin: 0.2rem 0 0 0; }
    }
    .btn-read {
      background: #f1f5f9;
      color: #1e3a5f;
      border: none;
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      &:hover { background: #e2e8f0; }
    }
    .notif-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .notif-card {
      display: flex;
      gap: 1rem;
      background: #ffffff;
      padding: 1.1rem;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.03);
      &.read { opacity: 0.7; background: #f8fafc; }
    }
    .notif-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      background: #e2e8f0;
      flex-shrink: 0;
    }
    .notif-body {
      flex: 1;
      p { margin: 0.3rem 0 0 0; font-size: 0.85rem; color: #475569; }
    }
    .notif-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h4 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #1e293b; }
      .time-text { font-size: 0.75rem; color: #94a3b8; }
    }
  `]
})
export class HrNotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);

  notifications = signal<AppNotification[]>([]);

  ngOnInit(): void {
    this.notifService.getHrNotifications().subscribe(res => {
      if (res.success && res.data) this.notifications.set(res.data);
    });
  }

  markAllAsRead(): void {
    this.notifService.markAllRead().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    });
  }
}
