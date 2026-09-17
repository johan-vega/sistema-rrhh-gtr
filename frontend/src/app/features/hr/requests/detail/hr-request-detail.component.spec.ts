import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ApiResponse, AreaAvailabilitySummary, LeaveRequest } from '../../../../core/models';
import { HrRequestService } from '../../../../core/services/hr-services';
import { DocumentService } from '../../../../core/services/document.service';
import { HrRequestDetailComponent } from './hr-request-detail.component';

const request: LeaveRequest = {
  id: 7, employee_id: 1, start_date: '2026-09-29', end_date: '2026-10-02',
  reason: 'Permiso', request_date: '2026-09-20', status: 'PENDING',
  category: { id: 1, name: 'Permiso', requires_document: false, minimum_advance_days: 0, active: true },
};
const summary: AreaAvailabilitySummary = {
  blocked_dates: ['2026-09-30'], is_exempt: false,
  dates: [
    { date: '2026-09-29', approved_count: 1, limit: 2, available: true },
    { date: '2026-09-30', approved_count: 2, limit: 2, available: false },
  ],
};
const response = <T>(data: T): ApiResponse<T> => ({ success: true, message: 'OK', data });

describe('Detalle RRHH: disponibilidad informativa', () => {
  const service = { getById: vi.fn(), getAvailability: vi.fn(), approve: vi.fn(), reject: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    service.getById.mockReturnValue(of(response(request)));
    service.getAvailability.mockReturnValue(of(response(summary)));
    TestBed.configureTestingModule({
      imports: [HrRequestDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7' }) } } },
        { provide: HrRequestService, useValue: service },
        { provide: DocumentService, useValue: {} },
      ],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(HrRequestDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('carga al abrir, resalta fechas y no aprueba ni rechaza automáticamente', () => {
    const fixture = render();
    const element: HTMLElement = fixture.nativeElement;
    expect(service.getAvailability).toHaveBeenCalledWith(7, '2026-09-29', '2026-09-30');
    expect(element.querySelectorAll('.availability-day.requested')).toHaveLength(2);
    expect(element.querySelectorAll('.availability-day.near')).toHaveLength(1);
    expect(element.querySelectorAll('.availability-day.full')).toHaveLength(1);
    expect(element.textContent).toContain('Una o más fechas del periodo ya alcanzaron');
    const fullDay = element.querySelector<HTMLButtonElement>('.availability-day.full')!;
    fullDay.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedDate()).toBe('2026-09-30');
    expect(element.querySelector('.availability-note')?.textContent).toContain('2 / 2');
    expect(service.approve).not.toHaveBeenCalled();
    expect(service.reject).not.toHaveBeenCalled();
  });

  it('navega solo dentro de la solicitud y descarta respuestas del mes anterior', () => {
    const pending = new Subject<ApiResponse<AreaAvailabilitySummary>>();
    service.getAvailability.mockReturnValueOnce(pending);
    const fixture = render();
    const component = fixture.componentInstance;
    const october = { ...summary, blocked_dates: [], dates: [{ date: '2026-10-01', approved_count: 0, limit: 2, available: true }] };
    service.getAvailability.mockReturnValue(of(response(october)));
    component.changeAvailabilityMonth(1);
    pending.next(response(summary));
    expect(service.getAvailability).toHaveBeenLastCalledWith(7, '2026-10-01', '2026-10-02');
    expect(component.availability()).toEqual(october);
    expect(component.availabilityMessage()).toContain('No se detectan conflictos');
    component.changeAvailabilityMonth(1);
    expect(service.getAvailability).toHaveBeenCalledTimes(2);
  });

  it('una justificación muestra conteos neutrales y la exención, sin alertas de cupo', () => {
    service.getAvailability.mockReturnValue(of(response({ ...summary, is_exempt: true, blocked_dates: [] })));
    const fixture = render();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Las justificaciones de falta no están sujetas al límite');
    expect(element.textContent).not.toContain('Tope alcanzado');
    expect(element.querySelector('.availability-day.full, .availability-day.near')).toBeNull();
    expect(fixture.componentInstance.availabilityMessage()).toBe('');
  });

  it('un error no se interpreta como disponibilidad y permite reintentar', () => {
    service.getAvailability.mockReturnValueOnce(throwError(() => new Error('Sin conexión')));
    const fixture = render();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No se pudo consultar');
    expect(element.textContent).not.toContain('No se detectan conflictos');
    element.querySelector<HTMLButtonElement>('.availability-section .doc-link')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(service.getAvailability).toHaveBeenCalledTimes(2);
  });

  it('no carga el bloque para solicitudes ya resueltas y reconoce sin límite', () => {
    service.getById.mockReturnValue(of(response({ ...request, status: 'APPROVED' })));
    const fixture = render();
    expect(service.getAvailability).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.availability-section')).toBeNull();
    const day = { date: '2026-09-29', approved_count: 20, limit: null, available: true };
    expect(fixture.componentInstance.availabilityStatus(day)).toBe('Disponible');
    expect(fixture.componentInstance.dayDescription(day)).toContain('20 / sin límite');
  });
});
