import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HrRequestService } from './hr-services';
import { environment } from '../../../environments/environment';

describe('Aprobación: envío del comentario', () => {
  it('envía observation al endpoint existente y mapea la respuesta', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(HrRequestService);
    const received = vi.fn();
    service.approve(7, 'Coordinar con su supervisor.').subscribe(received);
    const request = http.expectOne(`${environment.apiUrl}/hr/requests/7/approve`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ observation: 'Coordinar con su supervisor.' });
    request.flush({ success: true, message: 'OK', data: {
      id: 7, status: 'APROBADA', hr_observation: 'Coordinar con su supervisor.',
      category: { id: 1, name: 'Permiso', minimum_notice_days: 0 },
    } });
    expect(received).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      status: 'APPROVED', rrhh_observation: 'Coordinar con su supervisor.',
    }) }));
    http.verify();
  });
});
