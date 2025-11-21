
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This service handles Web Push Notifications.
// In a production PWA, this would be coupled with a Service Worker.

export const NOTIFICATION_TYPES = {
    MORNING_STREAK: {
        title: "🔥 Good Morning! Streak at Risk!",
        body: "Don't let your 5-day streak die. Claim your daily chest now.",
        icon: "/vite.svg"
    },
    MARKET_CLOSE: {
        title: "💰 Market Closed!",
        body: "You made +$4,206.90 today in Wall Street Zoo. Check your portfolio!",
        icon: "/vite.svg"
    },
    STREAK_DANGER: {
        title: "⚠️ BRO YOUR STREAK DIES IN 3 HOURS",
        body: "Log in now or lose your Diamond Multiplier.",
        icon: "/vite.svg"
    },
    SOCIAL_LIKE: {
        title: "❤️ New Like",
        body: "Elon Tusk liked your portfolio snapshot!",
        icon: "/vite.svg"
    }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.log('This browser does not support desktop notification');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

export const sendMockNotification = (type: keyof typeof NOTIFICATION_TYPES) => {
    if (Notification.permission === 'granted') {
        const config = NOTIFICATION_TYPES[type];
        
        // Check if service worker is available (for mobile)
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(config.title, {
                    body: config.body,
                    icon: config.icon,
                    vibrate: [200, 100, 200]
                } as any);
            });
        } else {
            // Desktop fallback
            new Notification(config.title, {
                body: config.body,
                icon: config.icon
            });
        }
    }
};

// Simulate the daily schedule described in the prompt
export const scheduleDemoNotifications = () => {
    if (Notification.permission !== 'granted') return;

    console.log("🔔 Notification Schedule Started (Demo Mode)");

    // Simulate a "Market Close" notification appearing 10 seconds after app load for demo effect
    setTimeout(() => {
        sendMockNotification('MARKET_CLOSE');
    }, 10000);

    // Simulate a "Streak Danger" notification appearing 30 seconds after app load
    setTimeout(() => {
        sendMockNotification('STREAK_DANGER');
    }, 30000);
};
