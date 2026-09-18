import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { mapWorker } from '../../../core/mappers/api.mappers';
import { HrAreaService, HrPositionService } from '../../../core/services/hr-area-position.service';
import { HrWorkerService } from '../../../core/services/hr-worker.service';
import { HrWorkerFormComponent } from './hr-worker-form.component';

const response = <T>(data: T) => ({ success: true, message: 'OK', data });
const area = { id: 1, name: 'Producción', active: true };
const position = { id: 2, name: 'Operario', active: true };
const worker = { id: 7, first_name: 'Ana', last_name: 'Pérez', dni: '12345678', email: 'ana@example.test',
  area, position, worker_type: 'OBRERO', birth_date: '1990-05-20', active: true };

describe('Formulario RRHH: fecha de ingreso', () => {
  const service = { getById: vi.fn(), create: vi.fn(), update: vi.fn() };
  const route = { snapshot: { params: {} as Record<string, string> } };
  beforeEach(() => {
    vi.resetAllMocks();
    route.snapshot.params = {};
    service.create.mockReturnValue(of(response(mapWorker(worker))));
    service.update.mockReturnValue(of(response(mapWorker(worker))));
    TestBed.configureTestingModule({
      imports: [HrWorkerFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: route },
        { provide: HrWorkerService, useValue: service },
        { provide: HrAreaService, useValue: { getAll: () => of(response([area])) } },
        { provide: HrPositionService, useValue: { getAll: () => of(response([position])) } },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  async function render() {
    const fixture = TestBed.createComponent(HrWorkerFormComponent);
    Object.assign(fixture.componentInstance.payload, { name: 'Ana', last_name: 'Pérez', dni: '12345678',
      email: 'ana@example.test', password: '010190', area_id: 1, position_id: 2, worker_type: 'OBRERO', birth_date: '1990-05-20' });
    fixture.autoDetectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('es opcional, empieza vacío y envía la fecha seleccionada al crear', async () => {
    const fixture = await render();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#hire-date');
    expect(input.value).toBe('');
    expect(input.required).toBe(false);
    input.value = '2020-02-29';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    const form = fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm);
    expect(form.valid).toBe(true);
    fixture.componentInstance.onSubmit(form);
    expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ hire_date: '2020-02-29' }));
  });

  it.each([null, '2014-09-18'])('carga la fecha existente (%s) y permite completarla o corregirla al editar', async hireDate => {
    route.snapshot.params = { id: '7' };
    service.getById.mockReturnValue(of(response(mapWorker({ ...worker, hire_date: hireDate }))));
    const fixture = await render();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#hire-date');
    expect(input.value).toBe(hireDate ?? '');
    input.value = '2018-05-02';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    fixture.componentInstance.onSubmit(fixture.debugElement.query(By.directive(NgForm)).injector.get(NgForm));
    expect(service.update).toHaveBeenCalledWith(7, expect.objectContaining({ hire_date: '2018-05-02' }));
  });
});
