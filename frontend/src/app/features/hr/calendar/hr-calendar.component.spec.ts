import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { ApiResponse, CalendarEvent, LeaveRequest } from '../../../core/models';
import { CalendarService } from '../../../core/services/calendar.service';
import { HrRequestService } from '../../../core/services/hr-services';
import { HrCalendarComponent } from './hr-calendar.component';

const event: CalendarEvent = { id: 7, title: 'Descanso', employee_name: 'Ana Pérez', category: 'Vacaciones',
  start_date: '2026-11-19', end_date: '2026-11-20', status: 'APPROVED' };
const detail: LeaveRequest = { id: 7, employee_id: 1, start_date: event.start_date, end_date: event.end_date,
  request_date: '2026-11-01', status: 'APPROVED', reason: 'Viaje familiar', rrhh_observation: 'Coordinar entrega',
  category: { id: 2, name: 'Vacaciones', requires_document: false, minimum_advance_days: 0, active: true } };
const response = <T>(data: T): ApiResponse<T> => ({ success: true, message: 'OK', data });

describe('Calendario RRHH: resumen de permisos', () => {
  let fixture: ComponentFixture<HrCalendarComponent>;
  let component: HrCalendarComponent;
  let dialog: HTMLDialogElement;
  const getById = vi.fn();

  beforeEach(() => {
    getById.mockReset().mockReturnValue(of(response(detail)));
    TestBed.configureTestingModule({ imports: [HrCalendarComponent], providers: [provideRouter([]),
      { provide: CalendarService, useValue: { getHrEvents: () => of(response([event])) } },
      { provide: HrRequestService, useValue: { getById } },
    ] });
    fixture = TestBed.createComponent(HrCalendarComponent);
    component = fixture.componentInstance;
    component.currentDate = new Date(2026, 10, 1);
    fixture.detectChanges();
    dialog = fixture.nativeElement.querySelector('dialog');
    // jsdom no implementa la capa superior nativa de HTMLDialogElement.
    dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
    dialog.close = vi.fn(() => dialog.removeAttribute('open'));
    component.selectDay({ date: event.start_date });
    fixture.detectChanges();
  });

  it('abre desde el descanso aprobado y muestra mensajes, periodo y enlace al detalle', () => {
    fixture.nativeElement.querySelector('.summary-trigger').click();
    fixture.detectChanges();
    expect(getById).toHaveBeenCalledWith(7);
    expect(dialog.open).toBe(true);
    for (const text of ['Ana Pérez', 'Vacaciones', '19/11/2026', '20/11/2026', 'Viaje familiar', 'Coordinar entrega']) {
      expect(dialog.textContent).toContain(text);
    }
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe('/hr/requests/7');
    dialog.querySelector<HTMLButtonElement>('.summary-actions button')!.click();
    expect(dialog.open).toBe(false);
    expect(component.summaryRequest()).toBeNull();
  });

  it('indica carga, permite reintentar y muestra la ausencia de comentario', () => {
    const pending = new Subject<ApiResponse<LeaveRequest>>();
    getById.mockReturnValueOnce(pending);
    component.openSummary(event);
    fixture.detectChanges();
    expect(dialog.textContent).toContain('Cargando resumen');
    pending.error(new Error('Sin conexión'));
    fixture.detectChanges();
    expect(dialog.querySelector('[role=alert]')).not.toBeNull();
    getById.mockReturnValue(of(response({ ...detail, rrhh_observation: '' })));
    Array.from(dialog.querySelectorAll('button')).find(button => button.textContent === 'Reintentar')!.click();
    fixture.detectChanges();
    expect(dialog.textContent).toContain('Sin comentario');
  });

  it('cierra con Escape y descarta respuestas pendientes de otro resumen', () => {
    const pending = new Subject<ApiResponse<LeaveRequest>>();
    getById.mockReturnValueOnce(pending);
    component.openSummary(event);
    component.closeSummary();
    component.openSummary({ ...event, id: 8 });
    pending.next(response({ ...detail, reason: 'Respuesta anterior' }));
    expect(component.summaryRequest()?.reason).toBe('Viaje familiar');
    dialog.dispatchEvent(new Event('cancel'));
    expect(component.summaryEvent()).toBeNull();
    expect(dialog.open).toBe(false);
  });
});
