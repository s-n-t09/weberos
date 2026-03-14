self.addEventListener('push', function(event) {
  const data = event.data.json();
  const title = data.title || 'WeberOS Notification';
  const options = {
    body: data.message,
    icon: '/logo.png',
    badge: '/logo.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
