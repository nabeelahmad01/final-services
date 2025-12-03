import { create } from 'zustand';

export type BannerType = 'success' | 'error' | 'warning' | 'info';

export interface BannerNotification {
    id: string;
    type: BannerType;
    title: string;
    message: string;
    duration: number; // milliseconds, default 5000
    onPress?: () => void;
    data?: any;
}

interface BannerStore {
    currentBanner: BannerNotification | null;
    queue: BannerNotification[];
    showBanner: (banner: Omit<BannerNotification, 'id'>) => void;
    hideBanner: () => void;
    clearQueue: () => void;
}

export const useBannerStore = create<BannerStore>((set, get) => ({
    currentBanner: null,
    queue: [],

    showBanner: (banner) => {
        const newBanner: BannerNotification = {
            ...banner,
            id: `banner_${Date.now()}_${Math.random()}`,
            duration: banner.duration ?? 5000,
        };

        const { currentBanner, queue } = get();

        if (currentBanner) {
            // Add to queue if a banner is already showing
            set({ queue: [...queue, newBanner] });
        } else {
            // Show immediately
            set({ currentBanner: newBanner });

            // Auto-dismiss after duration
            if (newBanner.duration > 0) {
                setTimeout(() => {
                    const { currentBanner: current } = get();
                    if (current?.id === newBanner.id) {
                        get().hideBanner();
                    }
                }, newBanner.duration);
            }
        }
    },

    hideBanner: () => {
        const { queue } = get();

        if (queue.length > 0) {
            // Show next banner from queue
            const [nextBanner, ...remainingQueue] = queue;
            set({ currentBanner: nextBanner, queue: remainingQueue });

            // Auto-dismiss the next banner
            const duration = nextBanner.duration ?? 5000;
            if (duration > 0) {
                setTimeout(() => {
                    const { currentBanner } = get();
                    if (currentBanner?.id === nextBanner.id) {
                        get().hideBanner();
                    }
                }, duration);
            }
        } else {
            set({ currentBanner: null });
        }
    },

    clearQueue: () => {
        set({ queue: [], currentBanner: null });
    },
}));
