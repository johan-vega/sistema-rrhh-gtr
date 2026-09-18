import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../../core/services/auth.service';
import { WorkerProfileComponent } from './worker-profile.component';
import { environment } from '../../../../environments/environment';

describe('Perfil del trabajador: dirección DNI y teléfono de emergencia', () => {
  let fixture: ComponentFixture<WorkerProfileComponent>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/profile`;
  const worker = { id: 7, first_name: 'Ana', last_name: 'Pérez', dni: '12345678', email: 'ana@example.test',
    address: 'Casa actual', phone: '900000001', dni_address: 'Dirección DNI anterior', emergency_phone: '900000002',
    birth_date: '1990-01-01', worker_type: 'OBRERO', has_photo: false, active: true };
  const response = (data: unknown) => ({ success: true, message: 'OK', data });

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [WorkerProfileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: () => ({ role: 'worker' }) } }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(WorkerProfileComponent);
    fixture.autoDetectChanges();
    http.expectOne(url).flush(response(worker));
    await fixture.whenStable();
  });
  afterEach(() => { fixture.destroy(); http.verify(); });

  function setInput(id: string, value: string) {
    const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('carga los campos editables y guarda ambos en el endpoint de perfil', async () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector<HTMLInputElement>('#dni-address')!.value).toBe(worker.dni_address);
    expect(element.querySelector<HTMLInputElement>('#emergency-phone')!.value).toBe(worker.emergency_phone);
    expect(element.querySelector('.detail-list')!.textContent).not.toContain('Dirección según DNI');
    expect(element.querySelector('.detail-list')!.textContent).not.toContain('Teléfono de emergencia');
    expect(element.querySelector('.readonly-notice')!.textContent).toContain('solo pueden ser modificados por RRHH');
    setInput('dni-address', 'Nueva dirección DNI 123');
    setInput('emergency-phone', '+51 900 123 456');
    element.querySelector<HTMLButtonElement>('#btn-guardar-perfil')!.click();
    const request = http.expectOne(url);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ address: worker.address, phone: worker.phone,
      dni_address: 'Nueva dirección DNI 123', emergency_phone: '+51 900 123 456' });
    request.flush(response({ ...worker, ...request.request.body }));
    await fixture.whenStable();
    expect(fixture.componentInstance.user()?.dni_address).toBe('Nueva dirección DNI 123');
    expect(element.textContent).toContain('Cambios guardados correctamente');
  });

  it('envía null para borrar valores anteriores y muestra vacíos al volver a cargar', async () => {
    setInput('dni-address', '');
    setInput('emergency-phone', '');
    fixture.componentInstance.onSave();
    const request = http.expectOne(url);
    expect(request.request.body.dni_address).toBeNull();
    expect(request.request.body.emergency_phone).toBeNull();
    const updated = { ...worker, dni_address: null, emergency_phone: null };
    request.flush(response(updated));
    fixture.destroy();
    fixture = TestBed.createComponent(WorkerProfileComponent);
    fixture.autoDetectChanges();
    http.expectOne(url).flush(response(updated));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#dni-address').value).toBe('');
    expect(fixture.nativeElement.querySelector('#emergency-phone').value).toBe('');
  });

  it('valida longitudes antes de enviar y mantiene valores cuando falla el guardado', async () => {
    fixture.componentInstance.form.patchValue({ dni_address: 'a'.repeat(256), emergency_phone: '1'.repeat(31) });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#btn-guardar-perfil').disabled).toBe(true);
    fixture.componentInstance.onSave();
    http.expectNone(url);
    fixture.componentInstance.form.patchValue({ dni_address: 'a'.repeat(255), emergency_phone: '1'.repeat(30) });
    fixture.componentInstance.onSave();
    http.expectOne(url).flush({ message: 'Error al guardar' }, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(fixture.componentInstance.form.controls.dni_address.value).toHaveLength(255);
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Error al guardar');
  });
});
