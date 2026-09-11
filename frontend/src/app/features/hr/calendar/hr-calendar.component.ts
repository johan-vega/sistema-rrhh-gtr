import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HrRequestService } from '../../../core/services/hr-services';
import { LeaveRequest } from '../../../core/models/index';

@Component({
  selector: 'app-hr-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hr-calendar-container">
      <div class="header-section">
        <h2>Calendario General de Solicitudes</h2>
        <p>Visualiza vacaciones, licencias y permisos aprobados o pendientes por fecha.</p>
      </div>

      <div class="calendar-card">
        <div class="month-nav">
          <button (click)="prevMonth()" class="btn-icon">&lsaquo; Mes Anterior</button>
          <span class="current-month">{{ currentMonthName }} {{ currentYear }}</span>
          <button (click)="nextMonth()" class="btn-icon">Mes Siguiente &rsaquo;</button>
        </div>

        <div class="calendar-grid">
          <div class="day-header" *ngFor="let d of daysOfWeek">{{ d }}</div>
          <div 
            *ngFor="let day of calendarDays" 
            class="day-cell"
            [class.empty]="!day.date"
            [class.today]="day.isToday"
          >
            <span class="day-number" *ngIf="day.date">{{ day.dayNumber }}</span>
            <div class="events-list" *ngIf="day.date">
              <div 
                *ngFor="let req of day.events" 
                class="event-pill"
                [class.approved]="req.status === 'APPROVED'"
                [class.pending]="req.status === 'PENDING'"
                [title]="req.reason"
              >
                <span class="emp-name">{{ req.employee?.name }}</span>
                <span class="cat-tag">{{ req.category?.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hr-calendar-container {
      padding: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .header-section {
      margin-bottom: 1.5rem;
      h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0 0 0.4rem 0; }
      p { color: #64748b; font-size: 0.9rem; margin: 0; }
    }
    .calendar-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .month-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .current-month {
      font-weight: 800;
      font-size: 1.2rem;
      color: #1e3a5f;
    }
    .btn-icon {
      background: #f1f5f9;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 10px;
      font-weight: 700;
      color: #1e3a5f;
      cursor: pointer;
      &:hover { background: #e2e8f0; }
    }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }
    .day-header {
      text-align: center;
      font-weight: 800;
      font-size: 0.8rem;
      color: #64748b;
      padding: 0.5rem 0;
      text-transform: uppercase;
    }
    .day-cell {
      min-height: 90px;
      background: #f8fafc;
      border-radius: 10px;
      padding: 0.4rem;
      border: 1px solid #edf2f7;
      display: flex;
      flex-direction: column;
      &.empty { background: transparent; border: none; }
      &.today { border-color: #2e86de; background: rgba(46, 134, 222, 0.04); }
    }
    .day-number {
      font-weight: 800;
      font-size: 0.82rem;
      color: #334155;
      margin-bottom: 0.3rem;
    }
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .event-pill {
      font-size: 0.68rem;
      padding: 3px 6px;
      border-radius: 6px;
      background: #e2e8f0;
      color: #334155;
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      &.approved { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
      &.pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
      .emp-name { font-weight: 700; }
      .cat-tag { font-size: 0.62rem; opacity: 0.85; }
    }
  `]
})
export class HrCalendarComponent implements OnInit {
  private requestService = inject(HrRequestService);

  daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  currentDate = new Date();
  currentMonthName = '';
  currentYear = 2026;

  calendarDays: Array<{ dayNumber: number; date: string | null; isToday: boolean; events: LeaveRequest[] }> = [];
  requests = signal<LeaveRequest[]>([]);

  ngOnInit(): void {
    this.requestService.getAll().subscribe(res => {
      if (res.success && res.data) {
        this.requests.set(res.data);
        this.buildCalendar();
      }
    });
  }

  buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.currentYear = year;
    this.currentMonthName = this.currentDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: 0, date: null, isToday: false, events: [] });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = this.requests().filter(r => dateStr >= r.start_date && dateStr <= r.end_date);
      days.push({
        dayNumber: d,
        date: dateStr,
        isToday: dateStr === todayStr,
        events: dayEvents,
      });
    }

    this.calendarDays = days;
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
  }
}
