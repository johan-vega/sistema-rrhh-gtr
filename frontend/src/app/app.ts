import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaService } from './core/services/pwa.service';
import { PwaInstallBannerComponent } from './shared/components/pwa-install-banner/pwa-install-banner.component';

@Component({
  imports: [RouterOutlet, PwaInstallBannerComponent],
  selector: 'app-root',
  template: `<router-outlet /><app-pwa-install-banner />`,
  styles: [`:host { display: block; min-height: 100vh; }`],
})
export class App {
  // Inicializa los listeners PWA antes de que se cargue cualquier ruta.
  private readonly pwa = inject(PwaService);
}
