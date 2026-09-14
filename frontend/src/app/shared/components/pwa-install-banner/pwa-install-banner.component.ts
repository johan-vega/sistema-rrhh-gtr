import { Component, inject, signal } from '@angular/core';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-install-banner',
  templateUrl: './pwa-install-banner.component.html',
  styleUrl: './pwa-install-banner.component.scss',
})
export class PwaInstallBannerComponent {
  readonly pwa = inject(PwaService);
  private readonly dismissed = signal(false);

  shouldShow(): boolean {
    return !this.dismissed() && !this.pwa.isInstalled() && (this.pwa.installAvailable() || this.pwa.isIos());
  }

  install(): void {
    void this.pwa.install();
  }

  dismiss(): void {
    this.dismissed.set(true);
  }
}
