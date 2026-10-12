import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HrCategoriesComponent } from './hr-categories.component';
import { environment } from '../../../../environments/environment';

describe('Categorías: sin días de anticipación', () => {
  let fixture: ComponentFixture<HrCategoriesComponent>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/hr/categories`;
  const category = { id: 17, name: 'Permiso', requires_document: false, active: true, minimum_notice_days: 15,
    maximum_past_days: 7, is_absence: true, unrestricted_dates: false };
  const response = (data: unknown) => ({ success: true, message: 'OK', data });

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [HrCategoriesComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HrCategoriesComponent);
    fixture.autoDetectChanges();
    http.expectOne(url).flush(response([category]));
    await fixture.whenStable();
  });
  afterEach(() => { fixture.destroy(); http.verify(); });

  it.each([false, true])('deshabilita anticipación, conserva los días y guarda el checkbox (edición: %s)', async editing => {
    const el: HTMLElement = fixture.nativeElement;
    if (editing) el.querySelector<HTMLButtonElement>('.btn-edit')!.click();
    else {
      const name = el.querySelector<HTMLInputElement>('input[type="text"]')!;
      name.value = 'Permiso nuevo'; name.dispatchEvent(new Event('input'));
      const days = el.querySelector<HTMLInputElement>('#minimum-advance-days')!;
      days.value = '15'; days.dispatchEvent(new Event('input'));
    }
    await fixture.whenStable();
    const days = el.querySelector<HTMLInputElement>('#minimum-advance-days')!;
    const checkbox = el.querySelector<HTMLInputElement>('#unrestricted-dates')!;
    expect(checkbox.checked).toBe(false);
    expect(days.disabled).toBe(false);
    checkbox.click();
    await fixture.whenStable();
    expect(days.disabled).toBe(true);
    expect(days.value).toBe('15');
    checkbox.click();
    await fixture.whenStable();
    expect(days.disabled).toBe(false);
    expect(days.value).toBe('15');
    checkbox.click();
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('.form-actions .btn-primary')!.click();
    const save = http.expectOne(editing ? `${url}/17` : url);
    expect(save.request.method).toBe(editing ? 'PUT' : 'POST');
    expect(save.request.body.unrestricted_dates).toBe(true);
    expect(save.request.body.minimum_notice_days).toBe(15);
    const updated = { ...category, unrestricted_dates: true };
    save.flush(response(updated));
    http.expectOne(url).flush(response([updated]));
    await fixture.whenStable();
    expect(el.querySelector('.cat-rules')!.textContent).toContain('Sin días de anticipación');
    expect(el.querySelector('.cat-rules')!.textContent).not.toContain('Hasta 7');
    el.querySelector<HTMLButtonElement>('.btn-edit')!.click();
    await fixture.whenStable();
    expect(checkbox.checked).toBe(true);
    expect(days.disabled).toBe(true);
    checkbox.click();
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('.form-actions .btn-primary')!.click();
    const disable = http.expectOne(`${url}/17`);
    expect(disable.request.body.unrestricted_dates).toBe(false);
    expect(disable.request.body.minimum_notice_days).toBe(15);
    disable.flush(response(category));
    http.expectOne(url).flush(response([category]));
    await fixture.whenStable();
    expect(el.querySelector('.cat-rules')!.textContent).toContain('Mín. 15');
  });
});
