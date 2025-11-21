
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This service simulates Web Push Notifications for the demo.
// In production, this would use Firebase Cloud Messaging (FCM) and Service Workers.

export const NOTIFICATION_TYPES = {
    MORNING_STREAK: {
        title: "🔥 Good Morning! Streak at Risk!",
        body: "Don't let your 5-day streak die. Claim your daily chest now.",
        icon: "🔥"
    },
    MARKET_CLOSE: {
        title: "💰 Market Closed!",
        body: "You made +$1,337 today in Wall Street Zoo. Check your portfolio!",
        icon: "📈"
    },
    STREAK_DANGER: {
        title: "⚠️ BRO YOUR STREAK DIES IN 3 HOURS",
        body: "Log in now or lose your Diamond Multiplier.",
        icon: "⏰"
    },
    SOCIAL_LIKE: {
        title: "❤️ New Like",
        body: "Elon Tusk liked your portfolio snapshot!",
        icon: "👍"
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
        new Notification(config.title, {
            body: config.body,
            icon: '/vite.svg', // Placeholder icon
            badge: '/vite.svg'
        });
    }
};

// Simulate the daily schedule described in the prompt
// In a real app, this runs on the server/cloud functions
export const scheduleDemoNotifications = () => {
    if (Notification.permission !== 'granted') return;

    console.log("🔔 Notification Schedule Started (Demo Mode)");

    // Simulate a "Market Close" notification appearing 5 seconds after app load for demo effect
    setTimeout(() => {
        sendMockNotification('MARKET_CLOSE');
    }, 5000);

    // Simulate a "Streak Danger" notification appearing 15 seconds after app load
    setTimeout(() => {
        sendMockNotification('STREAK_DANGER');
    }, 15000);
};
