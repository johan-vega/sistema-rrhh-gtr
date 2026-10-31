import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HrRequestService } from '../../../../core/services/hr-services';
import { mapRequest } from '../../../../core/mappers/api.mappers';
import { HrRequestsListComponent } from './hr-requests-list.component';

describe('Listado RRHH: fecha y hora de creación', () => {
  it.each([
    ['2026-10-31T19:35:00.000000Z', '31/10/2026 14:35'],
    ['2026-11-01T02:10:00.000000Z', '31/10/2026 21:10'],
    ['2026-10-31T14:35:00-05:00', '31/10/2026 14:35'],
  ])('conserva el timestamp %s de la API y lo presenta en Lima', (timestamp, expected) => {
    const request = mapRequest({ id: 7, requested_at: timestamp, start_date: '2026-11-03', end_date: '2026-11-04',
      reason: 'Permiso', status: 'PENDIENTE', category: { id: 1, name: 'Permiso', minimum_notice_days: 0 } });
    TestBed.configureTestingModule({
      imports: [HrRequestsListComponent],
      providers: [provideRouter([]), { provide: HrRequestService, useValue: {
        getAll: () => of({ success: true, message: 'OK', data: [request] }),
      } }],
    });
    const fixture = TestBed.createComponent(HrRequestsListComponent);
    fixture.detectChanges();
    expect(request.request_date).toBe(timestamp);
    expect(fixture.nativeElement.querySelector('.creation-date').textContent).toContain(expected);
    expect(fixture.nativeElement.querySelector('.creation-date').textContent).toContain('hora de Lima');
    expect(fixture.nativeElement.querySelector('.dates-row').textContent).toContain('03');
    expect(fixture.nativeElement.querySelector('.dates-row').textContent).toContain('04');
    expect(fixture.nativeElement.querySelector('.btn-detail').getAttribute('href')).toBe('/hr/requests/7');
  });
});
