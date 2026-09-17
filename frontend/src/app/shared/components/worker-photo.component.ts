import { Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-worker-photo',
  template: `@if ((preview || url()) && !failed()) {
    <img [src]="preview || url()" alt="Foto del trabajador" (error)="failed.set(true)" />
  } @else { <span>{{ initials }}</span> }`,
  styles: [`:host { display:inline-flex; width:100%; height:100%; align-items:center; justify-content:center; overflow:hidden; border-radius:inherit; }
    img { width:100%; height:100%; object-fit:cover; }`],
})
export class WorkerPhotoComponent implements OnChanges, OnDestroy {
  @Input() workerId?: number;
  @Input() hasPhoto = false;
  @Input() initials = '';
  @Input() preview: string | null = null;
  url = signal<string | null>(null);
  failed = signal(false);
  private http = inject(HttpClient);
  private subscription?: Subscription;
  ngOnChanges(): void {
    this.clear();
    this.failed.set(false);
    if (this.preview || !this.hasPhoto || !this.workerId) return;
    this.subscription = this.http.get(`${environment.apiUrl}/workers/${this.workerId}/photo`, {
      responseType: 'blob', params: { 'ngsw-bypass': 'true' },
    }).subscribe({ next: blob => this.url.set(URL.createObjectURL(blob)), error: () => this.url.set(null) });
  }
  ngOnDestroy(): void { this.clear(); }
  private clear(): void {
    this.subscription?.unsubscribe();
    const previous = this.url();
    if (previous) URL.revokeObjectURL(previous);
    this.url.set(null);
  }
}
