// DhobiGhat Background Web Push Service Worker (FCM)
// Handles incoming background push alerts for Store Terminal chimes and Rider dispatches

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const notification = data.notification || {};
    const title = notification.title || 'DhobiGhat Alert';
    const options = {
      body: notification.body || 'You have an order update',
      icon: notification.icon || '/favicon.ico',
      badge: notification.badge || '/favicon.ico',
      tag: notification.tag || 'dhobighat-alert',
      vibrate: [200, 100, 200],
      data: {
        clickAction: notification.click_action || data.data?.clickAction || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Error parsing push data', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.clickAction || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
