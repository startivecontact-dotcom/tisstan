import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-expect-error — exporté par firebase/auth pour React Native mais absent des types web.
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * L'app fonctionne en deux modes :
 *  - Firebase configuré (.env rempli)  → Firestore + Storage + Auth.
 *  - Mode démo (aucune variable)       → stockage local AsyncStorage.
 */
export const isFirebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseEnabled) {
  app = getApps()[0] ?? initializeApp(config);
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    auth = getAuth(app);
  }
  db = getFirestore(app);
  storage = getStorage(app);
}

export function requireDb(): Firestore {
  if (!db) throw new Error('Firestore non configuré — remplissez le fichier .env');
  return db;
}

export function requireAuth(): Auth {
  if (!auth) throw new Error('Firebase Auth non configuré — remplissez le fichier .env');
  return auth;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) throw new Error('Firebase Storage non configuré — remplissez le fichier .env');
  return storage;
}
