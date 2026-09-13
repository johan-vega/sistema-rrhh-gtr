import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarService } from '../../../core/services/calendar.service';
import { CalendarEvent } from '../../../core/models/index';

@Component({
  selector: 'app-hr-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hr-calendar-container">
      <div class="header-section">
        <h2>Calendario General de Solicitudes</h2>
        <p>Visualiza las solicitudes aprobadas por fecha.</p>
      </div>

      <div class="calendar-card">
        <div class="month-nav">
          <button (click)="prevMonth()" class="btn-icon" aria-label="Mes anterior">
            <span aria-hidden="true">&lsaquo;</span><span class="nav-label"> Mes anterior</span>
          </button>
          <span class="current-month">{{ currentMonthName }} {{ currentYear }}</span>
          <button (click)="nextMonth()" class="btn-icon" aria-label="Mes siguiente">
            <span class="nav-label">Mes siguiente </span><span aria-hidden="true">&rsaquo;</span>
          </button>
        </div>

        <div class="calendar-grid">
          <div class="day-header" *ngFor="let d of daysOfWeek">{{ d }}</div>
          <ng-container *ngFor="let day of calendarDays()">
            <div *ngIf="!day.date" class="day-cell empty"></div>
            <button
              *ngIf="day.date"
              type="button"
              class="day-cell"
              [class.today]="day.isToday"
              [class.has-events]="day.events.length > 0"
              [class.selected]="selectedDate() === day.date"
              [attr.aria-label]="dayAriaLabel(day)"
              (click)="selectDay(day)"
            >
              <span class="day-number">{{ day.dayNumber }}</span>
              <div class="events-list">
                <div *ngFor="let req of day.events" class="event-pill" title="Solicitud aprobada">
                  <span class="emp-name">{{ req.employee_name }}</span>
                  <span class="cat-tag">{{ req.category }}</span>
                </div>
              </div>
            </button>
          </ng-container>
        </div>
      </div>

      <section class="approved-details" aria-live="polite">
        <ng-container *ngIf="selectedDate(); else chooseDay">
          <h3>Descansos aprobados — {{ selectedDateLabel() }}</h3>
          <ng-container *ngIf="selectedEvents().length; else noApprovedEvents">
            <ul>
              <li *ngFor="let request of selectedEvents()">
                <span class="detail-dot" aria-hidden="true"></span>
                <div>
                  <strong>{{ request.employee_name }}</strong>
                  <span>{{ request.category }} · {{ request.start_date === request.end_date ? request.start_date : request.start_date + ' al ' + request.end_date }}</span>
                </div>
              </li>
            </ul>
          </ng-container>
          <ng-template #noApprovedEvents><p>No hay descansos aprobados para este día.</p></ng-template>
        </ng-container>
        <ng-template #chooseDay><p>Selecciona un día con punto verde para ver quiénes tienen descanso aprobado.</p></ng-template>
      </section>
    </div>
  `,
  styles: [`
    .hr-calendar-container {
      padding: 1.5rem;
      max-width: 1100px;
      margin: 0 auto;
      min-width: 0;
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
      overflow: hidden;
    }
    .month-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid #f1f5f9;
      gap: 0.5rem;
    }
    .current-month {
      font-weight: 800;
      font-size: 1.2rem;
      color: #1e3a5f;
      text-align: center;
      min-width: 0;
      flex: 1;
    }
    .btn-icon {
      background: #f1f5f9;
      border: none;
      padding: 0.5rem 0.75rem;
      border-radius: 10px;
      font-weight: 700;
      color: #1e3a5f;
      cursor: pointer;
      &:hover { background: #e2e8f0; }
    }
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
    }
    .day-header {
      text-align: center;
      font-weight: 800;
      font-size: 0.8rem;
      color: #64748b;
      padding: 0.5rem 0;
      text-transform: uppercase;
      min-width: 0;
    }
    .day-cell {
      min-width: 0;
      min-height: 82px;
      background: #f8fafc;
      border-radius: 10px;
      padding: 0.4rem;
      border: 1px solid #edf2f7;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      text-align: left;
      font: inherit;
      cursor: pointer;
      &.empty { background: transparent; border: none; }
      &.today { border-color: #2e86de; background: rgba(46, 134, 222, 0.04); }
      &.has-events:hover, &.has-events:focus-visible { border-color: #16a34a; outline: none; }
      &.selected { border-color: #0284c7; box-shadow: inset 0 0 0 1px #0284c7; }
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
      min-width: 0;
    }
    .event-pill {
      min-width: 0;
      font-size: 0.68rem;
      padding: 3px 6px;
      border-radius: 6px;
      background: #e2e8f0;
      color: #334155;
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;
      .emp-name { font-weight: 700; }
      .cat-tag { font-size: 0.62rem; opacity: 0.85; }
    }
    @media (max-width: 599px) {
      .hr-calendar-container { padding: 0.75rem; }
      .header-section { margin-bottom: 1rem; h2 { font-size: 1.25rem; } }
      .calendar-card { padding: 0.75rem; border-radius: 12px; }
      .month-nav { margin-bottom: 0.75rem; padding-bottom: 0.65rem; }
      .current-month { font-size: 0.95rem; }
      .btn-icon { min-width: 36px; padding: 0.45rem 0.55rem; }
      .nav-label { display: none; }
      .calendar-grid { gap: 2px; }
      .day-header { padding: 0.35rem 0; font-size: 0.75rem; }
      .day-cell { min-height: 58px; padding: 0.3rem; border-radius: 7px; }
      .day-number { margin-bottom: 0.15rem; font-size: 0.75rem; }
      .events-list { gap: 2px; }
      .event-pill { width: 8px; height: 8px; min-height: 8px; padding: 0; border-radius: 50%; }
      .event-pill .emp-name, .event-pill .cat-tag { display: none; }
    }
    .approved-details {
      margin-top: 1rem;
      padding: 1rem;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
      border-radius: 10px;
      h3 { margin: 0 0 0.75rem; color: #1e3a5f; font-size: 0.95rem; }
      p { margin: 0; color: #64748b; font-size: 0.875rem; }
      ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.65rem; margin: 0; padding: 0; list-style: none; }
      li { display: flex; align-items: flex-start; gap: 0.55rem; min-width: 0; }
      strong, span { display: block; }
      strong { color: #334155; font-size: 0.875rem; }
      li div > span { color: #64748b; font-size: 0.8rem; line-height: 1.35; }
    }
    .detail-dot { width: 9px; height: 9px; margin-top: 0.35rem; flex: 0 0 9px; border-radius: 50%; background: #22c55e; }
    @media (max-width: 599px) {
      .approved-details { margin-top: 0.75rem; padding: 0.75rem; }
      .approved-details ul { grid-template-columns: 1fr; }
    }
  `]
})
export class HrCalendarComponent implements OnInit {
  private calendarService = inject(CalendarService);

  daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  currentDate = new Date();
  currentMonthName = '';
  currentYear = 2026;

  calendarDays = signal<Array<{ dayNumber: number; date: string | null; isToday: boolean; events: CalendarEvent[] }>>([]);
  requests = signal<CalendarEvent[]>([]);
  selectedDate = signal<string | null>(null);

  ngOnInit(): void {
    // Renderiza el mes inmediatamente; los puntos se agregan al llegar la API.
    this.buildCalendar();

    this.calendarService.getHrEvents().subscribe({
      next: res => {
        if (res.success) this.requests.set(res.data ?? []);
        this.buildCalendar();
      },
      error: () => this.buildCalendar(),
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
      const dayEvents = this.requests().filter(r =>
        r.status === 'APPROVED' && dateStr >= r.start_date && dateStr <= r.end_date,
      );
      days.push({
        dayNumber: d,
        date: dateStr,
        isToday: dateStr === todayStr,
        events: dayEvents,
      });
    }

    this.calendarDays.set(days);
  }

  prevMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  selectDay(day: { date: string | null }): void {
    if (day.date) this.selectedDate.set(day.date);
  }

  selectedEvents(): CalendarEvent[] {
    const date = this.selectedDate();
    return date ? this.calendarDays().find(day => day.date === date)?.events ?? [] : [];
  }

  selectedDateLabel(): string {
    const date = this.selectedDate();
    if (!date) return '';
    return new Date(`${date}T00:00:00`).toLocaleDateString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  dayAriaLabel(day: { date: string | null; events: CalendarEvent[] }): string {
    if (!day.date) return '';
    const label = new Date(`${day.date}T00:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
    return `${label}. ${day.events.length} descanso(s) aprobado(s).`;
  }
}
