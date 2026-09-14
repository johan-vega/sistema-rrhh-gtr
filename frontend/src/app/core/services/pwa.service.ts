import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  readonly installAvailable = signal(false);
  readonly isInstalled = signal(this.detectInstalled());
  readonly isIos = signal(this.detectIos());
  readonly notificationsSupported = signal(this.hasNotificationApi());
  readonly notificationPermission = signal<NotificationPermission>(this.getNotificationPermission());

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (event) => {
      if (this.isInstalled()) return;
      event.preventDefault();
      this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
      this.installAvailable.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      this.installAvailable.set(false);
      this.isInstalled.set(true);
    });
  }

  async install(): Promise<void> {
    if (!this.deferredInstallPrompt || this.isInstalled()) return;

    try {
      await this.deferredInstallPrompt.prompt();
      await this.deferredInstallPrompt.userChoice;
    } catch {
      // El navegador puede cancelar el prompt; la aplicación continúa utilizable.
    } finally {
      this.deferredInstallPrompt = null;
      this.installAvailable.set(false);
    }
  }

  async requestNotifications(): Promise<NotificationPermission> {
    if (!this.notificationsSupported()) return 'denied';

    const currentPermission = this.getNotificationPermission();
    this.notificationPermission.set(currentPermission);
    if (currentPermission !== 'default') return currentPermission;

    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission.set(permission);

      if (permission === 'granted') {
        await this.showNotification(
          'Notificaciones activadas',
          'Recibirás avisos cuando lleguen nuevas solicitudes.',
        );
      }

      return permission;
    } catch {
      const permission = this.getNotificationPermission();
      this.notificationPermission.set(permission);
      return permission;
    }
  }

  async showNotification(title: string, body: string): Promise<void> {
    if (!this.notificationsSupported() || this.getNotificationPermission() !== 'granted') return;
    this.notificationPermission.set('granted');

    const options = { body, icon: '/assets/icons/icon-192.png' };
    try {
      const registration = await this.getServiceWorkerRegistration();
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    } catch {
      // Si el Service Worker no está disponible, se usa la API del navegador.
    }

    try {
      new Notification(title, options);
    } catch {
      // Algunos navegadores limitan las notificaciones fuera de una PWA instalada.
    }
  }

  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | undefined> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    return navigator.serviceWorker.getRegistration();
  }

  private hasNotificationApi(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  private getNotificationPermission(): NotificationPermission {
    return this.hasNotificationApi() ? Notification.permission : 'default';
  }

  private detectInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
    const standaloneDisplayMode = typeof window.matchMedia === 'function'
      && window.matchMedia('(display-mode: standalone)').matches;
    return standaloneDisplayMode || navigatorWithStandalone.standalone === true;
  }

  private detectIos(): boolean {
    if (typeof navigator === 'undefined') return false;
    const userAgent = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
}
