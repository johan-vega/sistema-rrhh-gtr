import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class PwaService {
  private deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
  readonly installAvailable = signal(false);
  readonly notificationPermission = signal<NotificationPermission>(this.getNotificationPermission());
  readonly notificationsSupported = signal(typeof Notification !== 'undefined');

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
      this.installAvailable.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      this.installAvailable.set(false);
    });
  }

  async install(): Promise<void> {
    if (!this.deferredInstallPrompt) return;
    await this.deferredInstallPrompt.prompt();
    await this.deferredInstallPrompt.userChoice;
    this.deferredInstallPrompt = null;
    this.installAvailable.set(false);
  }

  async requestNotifications(): Promise<NotificationPermission> {
    if (typeof Notification === 'undefined') return 'denied';
    const permission = await Notification.requestPermission();
    this.notificationPermission.set(permission);
    return permission;
  }

  async showNotification(title: string, body: string): Promise<void> {
    if (this.notificationPermission() !== 'granted') return;
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, { body, icon: '/assets/logo-generico-gtr.png' });
      return;
    }
    new Notification(title, { body, icon: '/assets/logo-generico-gtr.png' });
  }

  private getNotificationPermission(): NotificationPermission {
    return typeof Notification === 'undefined' ? 'default' : Notification.permission;
  }
}
