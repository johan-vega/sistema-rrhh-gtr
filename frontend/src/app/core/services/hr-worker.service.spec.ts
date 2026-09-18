import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HrWorkerService } from './hr-worker.service';
import { environment } from '../../../environments/environment';

describe('Trabajadores: cambio de contraseña', () => {
  let service: HrWorkerService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/hr/workers/7`;
  const result = { success: true, message: 'OK', data: { id: 7, first_name: 'Ana', last_name: 'Pérez' } };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(HrWorkerService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('no envía contraseña al dejarla vacía y envía los nuevos dígitos como texto', () => {
    service.update(7, { password: '', password_confirmation: '' }).subscribe();
    const empty = http.expectOne(url);
    expect(JSON.parse(empty.request.serializeBody() as string)).not.toHaveProperty('password');
    expect(JSON.parse(empty.request.serializeBody() as string)).not.toHaveProperty('password_confirmation');
    empty.flush(result);
    service.update(7, { password: '010190', password_confirmation: '010190' }).subscribe();
    const reset = http.expectOne(url);
    expect(reset.request.method).toBe('PUT');
    expect(reset.request.body.password).toBe('010190');
    expect(reset.request.body.password_confirmation).toBe('010190');
    reset.flush(result);
  });

  it('también envía contraseña y confirmación al actualizar con foto', async () => {
    const photo = new File(['foto'], 'foto.png', { type: 'image/png' });
    Object.defineProperty(photo, 'arrayBuffer', { value: async () => new Uint8Array([1, 2, 3]).buffer });
    service.update(7, { photo, password: '010190', password_confirmation: '010190' }).subscribe();
    await new Promise(resolve => setTimeout(resolve, 0));
    const reset = http.expectOne(req => req.url === url);
    expect(reset.request.method).toBe('POST');
    const body = reset.request.body as FormData;
    expect(body.get('_method')).toBe('PUT');
    expect(body.get('password')).toBe('010190');
    expect(body.get('password_confirmation')).toBe('010190');
    expect(body.get('photo')).toBeInstanceOf(Blob);
    reset.flush(result);
  });
});
