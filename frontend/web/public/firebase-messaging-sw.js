// Firebase Messaging Service Worker
// This file is required for Firebase Cloud Messaging to work in the background

// Import Firebase libraries using the global CDN approach for service workers
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration (same as in your main app)
const firebaseConfig = {
  apiKey: "AIzaSyBXRjFgdxnBk7U1DQVG6YLcUiKow-2OzNQ",
  authDomain: "running-academy-9eff6.firebaseapp.com",
  projectId: "running-academy-9eff6",
  storageBucket: "running-academy-9eff6.firebasestorage.app",
  messagingSenderId: "757275609167",
  appId: "1:757275609167:web:35605d27129400de94023a",
  measurementId: "G-XYYDD8XVNH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  // SECURITY: Console logging removed to prevent sensitive data exposure
  
  const { notification, data } = payload;
  
  // Customize the notification here
  const notificationTitle = notification?.title || 'DeyaRun';
  const notificationOptions = {
    body: notification?.body || 'You have a new notification',
    icon: notification?.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data?.type || 'default',
    data: data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: data?.priority === 'high',
    silent: data?.priority === 'low'
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  // SECURITY: Console logging removed to prevent data exposure

  event.notification.close();

  // Handle different actions
  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') {
    return;
  }

  // Default action or 'open' action
  let urlToOpen = '/dashboard';

  // Determine URL based on notification type
  switch (data.type) {
    case 'workout_reminder':
      urlToOpen = `/workouts/${data.workoutId || ''}`;
      break;
    case 'achievement':
      urlToOpen = `/profile?tab=achievements`;
      break;
    case 'course_reminder':
      urlToOpen = `/courses/${data.courseId || ''}`;
      break;
    case 'weekly_progress':
      urlToOpen = '/dashboard/progress';
      break;
    case 'social_update':
      urlToOpen = '/social';
      break;
    default:
      urlToOpen = '/dashboard';
  }

  // Open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: data,
            url: urlToOpen
          });
          return;
        }
      }
      
      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  // SECURITY: Console logging removed to prevent subscription data exposure
  
  // You might want to send the new subscription to your server here
  event.waitUntil(
    // Handle subscription change
    fetch('/api/push-notifications/update-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldSubscription: event.oldSubscription,
        newSubscription: event.newSubscription
      })
    })
  );
});