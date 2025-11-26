import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { app } from './app';
import { auth } from './auth';

export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

export { app, auth };
export default app;
