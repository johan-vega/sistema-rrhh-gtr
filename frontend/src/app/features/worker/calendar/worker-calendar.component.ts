import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CalendarService } from '../../../core/services/calendar.service';
import { CalendarEvent } from '../../../core/models/index';

const CATEGORY_COLORS: Record<string, string> = {
  'Vacaciones':            '#2E86DE',
  'Salud':                 '#E74C3C',
  'Motivo personal':       '#F39C12',
  'Justificación de falta':'#8E44AD',
  'Licencia':              '#27AE60',
};

@Component({
  selector: 'app-worker-calendar',
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './worker-calendar.component.html',
  styleUrl: './worker-calendar.component.scss',
})
export class WorkerCalendarComponent implements OnInit {
  private svc = inject(CalendarService);

  events     = signal<CalendarEvent[]>([]);
  loading    = signal(true);
  today      = new Date();
  currentDate= signal(new Date());

  get year()  { return this.currentDate().getFullYear(); }
  get month() { return this.currentDate().getMonth(); }

  get monthName() {
    return this.currentDate().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  }

  get calendarDays(): (number | null)[] {
    const firstDay = new Date(this.year, this.month, 1).getDay();
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const blanks = (firstDay === 0 ? 6 : firstDay - 1);
    const days: (number | null)[] = Array(blanks).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  ngOnInit(): void {
    this.svc.getWorkerEvents().subscribe({
      next: res => { this.events.set(res.data ?? []); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  prevMonth(): void {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
  }

  getEventsForDay(day: number): CalendarEvent[] {
    const dateStr = `${this.year}-${String(this.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return this.events().filter(e => {
      return dateStr >= e.start_date && dateStr <= e.end_date;
    });
  }

  isToday(day: number): boolean {
    const t = this.today;
    return t.getFullYear() === this.year && t.getMonth() === this.month && t.getDate() === day;
  }

  getColor(cat: string): string {
    return CATEGORY_COLORS[cat] ?? '#6B7280';
  }
}
