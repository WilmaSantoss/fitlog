/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Precache do bundle — mesma cobertura do generateSW anterior
precacheAndRoute(self.__WB_MANIFEST);

// Skip waiting: mesmo comportamento do registerType='prompt'
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

type PushPayload = {
  title?: string;
  body?: string;
  restSessionId?: string;
};

self.addEventListener('push', (event: PushEvent) => {
  const handle = async () => {
    let payload: PushPayload = {};
    try {
      payload = (event.data?.json() as PushPayload) ?? {};
    } catch {
      payload = { title: 'Fitlog', body: event.data?.text() ?? '' };
    }

    // IMPORTANTE: iOS PWA impõe "push budget" — todo push RECEBIDO precisa
    // resultar em showNotification, senão o iOS gasta budget e começa a
    // atrasar pushes futuros por minutos. Sempre mostramos a notificação,
    // mesmo com app focado (o chime local já tocou; a banner só reforça).
    await self.registration.showNotification(payload.title ?? 'Fitlog', {
      body: payload.body ?? '',
      tag: payload.restSessionId ?? 'fitlog-rest',
      icon: '/pwa-192.svg',
      badge: '/pwa-192.svg',
      // vibração roda mesmo com iOS locked; Apple ignora `sound` custom
      vibrate: [200, 100, 200, 100, 400],
      renotify: true,
    } as NotificationOptions & { vibrate?: number[]; renotify?: boolean });
  };
  event.waitUntil(handle());
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const handle = async () => {
    const clientsList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });
    const existing = clientsList[0];
    if (existing) {
      await existing.focus();
      return;
    }
    await self.clients.openWindow('/');
  };
  event.waitUntil(handle());
});
