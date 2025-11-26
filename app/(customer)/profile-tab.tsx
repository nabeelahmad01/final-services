import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// This is a redirect screen for the profile tab
// It redirects to the shared profile screen
export default function ProfileTab() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/(shared)/profile');
    }, []);

    return null;
}
