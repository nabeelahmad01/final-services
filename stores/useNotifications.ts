import { create } from 'zustand';
import { Notification } from '@/types';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    setNotifications: (notifications: Notification[]) => void;
    addNotification: (notification: Notification) => void;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

export const useNotifications = create<NotificationState>((set) => ({
    notifications: [],
    unreadCount: 0,

    setNotifications: (notifications) =>
        set({
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
        }),

    addNotification: (notification) =>
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount,
        })),

    markAsRead: (notificationId) =>
        set((state) => {
            const notifications = state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            );
            return {
                notifications,
                unreadCount: notifications.filter((n) => !n.read).length,
            };
        }),

    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        })),

    clearNotifications: () =>
        set({
            notifications: [],
            unreadCount: 0,
        }),
}));
