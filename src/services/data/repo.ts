import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import type { BaseDoc, UserId } from '@/types/models';
import { isFirebaseEnabled, requireDb } from '@/services/firebase';

/** Noms des collections Firestore (et des "tables" locales en mode démo). */
export type CollectionName =
  | 'weight'
  | 'meals'
  | 'sleep'
  | 'hydration'
  | 'workouts'
  | 'habits'
  | 'projects'
  | 'posts'
  | 'photos'
  | 'aiHistory'
  | 'users';

export interface ListQuery {
  userId?: UserId;
  /** Inclure aussi les documents partagés des autres utilisateurs. */
  includeShared?: boolean;
  date?: string;
  limit?: number;
}

// ------------------------------------------------------------------
// Implémentation locale (mode démo) — AsyncStorage, une clé par collection.
// ------------------------------------------------------------------

const localKey = (col: CollectionName) => `tisstan:db:${col}`;

async function localRead<T extends BaseDoc>(col: CollectionName): Promise<T[]> {
  const raw = await AsyncStorage.getItem(localKey(col));
  return raw ? (JSON.parse(raw) as T[]) : [];
}

async function localWrite<T extends BaseDoc>(col: CollectionName, docs: T[]): Promise<void> {
  await AsyncStorage.setItem(localKey(col), JSON.stringify(docs));
}

// ------------------------------------------------------------------
// API publique — même signature dans les deux modes.
// ------------------------------------------------------------------

export async function listDocs<T extends BaseDoc>(
  col: CollectionName,
  q: ListQuery = {},
): Promise<T[]> {
  let docs: T[];
  if (isFirebaseEnabled) {
    const constraints = [];
    if (q.userId && !q.includeShared) constraints.push(where('userId', '==', q.userId));
    if (q.date) constraints.push(where('date', '==', q.date));
    constraints.push(orderBy('createdAt', 'desc'));
    if (q.limit) constraints.push(fsLimit(q.limit));
    const snap = await getDocs(query(collection(requireDb(), col), ...constraints));
    docs = snap.docs.map((d) => d.data() as T);
    if (q.userId && q.includeShared) {
      docs = docs.filter((d) => d.userId === q.userId || d.shared);
    }
  } else {
    docs = await localRead<T>(col);
    if (q.userId) {
      docs = q.includeShared
        ? docs.filter((d) => d.userId === q.userId || d.shared)
        : docs.filter((d) => d.userId === q.userId);
    }
    if (q.date) docs = docs.filter((d) => (d as BaseDoc & { date?: string }).date === q.date);
    docs.sort((a, b) => b.createdAt - a.createdAt);
    if (q.limit) docs = docs.slice(0, q.limit);
  }
  return docs;
}

export async function upsertDoc<T extends BaseDoc>(col: CollectionName, docData: T): Promise<T> {
  if (isFirebaseEnabled) {
    await setDoc(doc(requireDb(), col, docData.id), docData as Record<string, unknown>, {
      merge: true,
    });
  } else {
    const docs = await localRead<T>(col);
    const idx = docs.findIndex((d) => d.id === docData.id);
    if (idx >= 0) docs[idx] = { ...docs[idx], ...docData };
    else docs.push(docData);
    await localWrite(col, docs);
  }
  return docData;
}

export async function removeDoc(col: CollectionName, id: string): Promise<void> {
  if (isFirebaseEnabled) {
    await deleteDoc(doc(requireDb(), col, id));
  } else {
    const docs = await localRead(col);
    await localWrite(col, docs.filter((d) => d.id !== id));
  }
}
