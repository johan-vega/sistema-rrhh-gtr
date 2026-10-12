import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { WorkerRequestNewComponent } from './worker-request-new.component';
import { CategoryService } from '../../../../core/services/category.service';
import { RequestAvailabilityService } from '../../../../core/services/request-availability.service';
import { RequestService } from '../../../../core/services/request.service';

describe('Nueva solicitud: selección y envío del documento', () => {
  let fixture: ComponentFixture<WorkerRequestNewComponent>;
  let component: WorkerRequestNewComponent;
  let create: ReturnType<typeof vi.fn>;
  let availability: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    create = vi.fn(() => new Subject());
    availability = vi.fn(() => of(null));
    await TestBed.configureTestingModule({
      imports: [WorkerRequestNewComponent],
      providers: [
        provideRouter([]),
        { provide: RequestAvailabilityService, useValue: { firstBlockedDate: availability } },
        { provide: RequestService, useValue: { create } },
        { provide: CategoryService, useValue: { getAll: () => of({ success: true, data: [{
          id: 4, name: 'Justificación de falta', requires_document: true,
          minimum_advance_days: 0, maximum_past_days: 7, is_absence: true, active: true,
        }] }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WorkerRequestNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // Dispara el cambio real del select con ngValue, no solo su valor visual.
    const select = fixture.nativeElement.querySelector('#category') as HTMLSelectElement;
    select.selectedIndex = 1;
    select.dispatchEvent(new Event('change'));
    component.form.patchValue({ start_date: '2026-09-14', end_date: '2026-09-14', reason: 'Justificación médica' });
    fixture.detectChanges();
  });

  function normalCategory(): void {
    const category = { ...component.categories()[0], is_absence: false, requires_document: false };
    component.categories.set([category]);
    component.selectedCategory.set(category);
    fixture.detectChanges();
  }

  it.each([false, true])('sin anticipación elimina el mínimo y los avisos para fechas pasadas o futuras (falta: %s)', absence => {
    const category = { ...component.categories()[0], unrestricted_dates: true, is_absence: absence, minimum_advance_days: 30 };
    component.categories.set([category]);
    component.form.controls.category_id.setValue(category.id);
    for (const date of ['2020-01-01', '2090-01-01']) {
      component.form.patchValue({ start_date: date, end_date: date });
      fixture.detectChanges();
      expect(component.minimumSelectableDate).toBe('');
      expect(fixture.nativeElement.querySelector('#start_date').min).toBe('');
      expect(component.dateWarning()).toBe('');
      expect(fixture.nativeElement.textContent).toContain('Sin días de anticipación');
      expect(fixture.nativeElement.textContent).not.toContain('Anticipación requerida:');
      expect(fixture.nativeElement.textContent).not.toContain('Justificación retroactiva:');
    }
    attach();
    component.onSubmit();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ category_id: category.id, start_date: '2090-01-01', document: component.selectedFile() }));
    component.loading.set(false);
    component.categories.set([{ ...category, unrestricted_dates: false }]);
    component.form.controls.category_id.setValue(category.id);
    component.form.patchValue({ start_date: '2020-01-01', end_date: '2020-01-01' });
    fixture.detectChanges();
    expect(component.minimumSelectableDate).not.toBe('');
    expect(component.dateWarning()).not.toBe('');
  });

  it('sin anticipación no omite cupo de área ni documento obligatorio', () => {
    const category = { ...component.categories()[0], unrestricted_dates: true, is_absence: false };
    component.categories.set([category]);
    component.form.controls.category_id.setValue(category.id);
    fixture.detectChanges();
    component.onSubmit();
    expect(create).not.toHaveBeenCalled();
    expect(component.error()).toContain('requiere adjuntar');
    attach();
    availability.mockReturnValue(of('2026-09-14'));
    component.startCtrl.updateValueAndValidity();
    fixture.detectChanges();
    component.onSubmit();
    expect(create).not.toHaveBeenCalled();
    expect(component.startCtrl.hasError('areaAvailability')).toBe(true);
  });

  it('rechaza visualmente una fecha bloqueada sin llamar al envío multipart', () => {
    availability.mockReturnValue(of('2026-09-14'));
    normalCategory();
    expect(component.startCtrl.hasError('areaAvailability')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('área alcanzó el límite');
    component.onSubmit();
    expect(create).not.toHaveBeenCalled();
  });

  it('comprueba el intervalo completo y bloquea envío mientras espera la API', () => {
    const pending = new Subject<string | null>();
    availability.mockReturnValue(pending);
    normalCategory();
    component.endCtrl.setValue('2026-09-20');
    fixture.detectChanges();
    expect(availability).toHaveBeenCalledWith('2026-09-14', '2026-09-20');
    expect(component.form.pending).toBe(true);
    component.onSubmit();
    expect(create).not.toHaveBeenCalled();
    pending.next('2026-09-17'); pending.complete();
    fixture.detectChanges();
    expect(component.endCtrl.hasError('areaAvailability')).toBe(true);
  });

  it('justificación no consulta cupo ni conserva bloqueos de otra categoría', () => {
    availability.mockReturnValue(of('2026-09-14'));
    normalCategory();
    availability.mockClear();
    component.selectedCategory.set({ ...component.categories()[0], is_absence: true });
    fixture.detectChanges();
    expect(availability).not.toHaveBeenCalled();
    expect(component.startCtrl.hasError('areaAvailability')).toBe(false);
    expect(component.endCtrl.hasError('areaAvailability')).toBe(false);
  });

  it('rechaza provisionalmente una fecha si no se puede consultar disponibilidad', () => {
    availability.mockReturnValue(throwError(() => new Error('offline')));
    normalCategory();
    expect(component.startCtrl.getError('areaAvailability')).toContain('No se pudo comprobar');
    component.onSubmit();
    expect(create).not.toHaveBeenCalled();
  });

  function attach(file = new File(['foto'], 'foto.jpg', { type: 'image/jpeg' })): HTMLInputElement {
    const input = fixture.nativeElement.querySelector('#doc-upload') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    return input;
  }

  it('mantiene el input montado, la categoría y las fechas después de adjuntar', () => {
    const input = attach();
    expect(fixture.nativeElement.querySelector('#doc-upload')).toBe(input);
    expect(component.form.value.category_id).toBe(4);
    expect(fixture.nativeElement.querySelector('.file-name').textContent).toContain('foto.jpg');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    expect(create).toHaveBeenCalledWith({
      category_id: 4, start_date: '2026-09-14', end_date: '2026-09-14', reason: 'Justificación médica',
      document: component.selectedFile(),
    });
  });

  it('permite quitar y volver a seleccionar el mismo archivo', () => {
    const input = attach();
    component.removeFile(input);
    fixture.detectChanges();
    expect(component.selectedFile()).toBeNull();
    expect(input.value).toBe('');
    expect(attach()).toBe(input);
    expect(component.selectedFile()?.name).toBe('foto.jpg');
  });

  it('no duplica el envío ni cambia el adjunto mientras se está leyendo/enviando', () => {
    const input = attach();
    component.onSubmit();
    component.onSubmit();
    component.removeFile(input);
    fixture.detectChanges();
    expect(create).toHaveBeenCalledTimes(1);
    expect(component.selectedFile()).not.toBeNull();
    expect(input.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('#btn-enviar-solicitud').disabled).toBe(true);
  });

  it('no sustituye una categoría vacía por la selección anterior', () => {
    attach();
    component.form.controls.category_id.setValue(null, { emitEvent: false });
    component.onSubmit();
    expect(create).not.toHaveBeenCalled();
    expect(component.error()).toContain('campos obligatorios');
  });

  it('no envía una justificación sin el documento obligatorio', () => {
    component.onSubmit();
    expect(create).not.toHaveBeenCalled();
    expect(component.error()).toContain('requiere adjuntar');
  });

  it('conserva los datos y muestra el fallo de lectura para poder reintentar', () => {
    attach();
    create.mockReturnValue(throwError(() => new Error('No se pudo leer el documento. Vuelve a seleccionarlo antes de enviar.')));
    component.onSubmit();
    expect(component.loading()).toBe(false);
    expect(component.error()).toContain('No se pudo leer el documento');
    expect(component.form.controls.category_id.value).toBe(4);
    expect(component.selectedFile()).not.toBeNull();
  });
});
