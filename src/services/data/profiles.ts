import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DEFAULT_GOALS, USERS } from '@/constants/config';
import { isFirebaseEnabled, requireDb } from '@/services/firebase';
import type { UserId, UserProfile } from '@/types/models';

const PROFILE_KEY = (id: UserId) => `tisstan:profile:${id}`;

export function defaultProfile(id: UserId): UserProfile {
  return {
    ...USERS[id],
    goals: { ...DEFAULT_GOALS },
    heightCm: 178,
    sex: 'male',
    birthYear: 1998,
  };
}

export async function loadProfile(id: UserId): Promise<UserProfile> {
  if (isFirebaseEnabled) {
    const snap = await getDoc(doc(requireDb(), 'users', id));
    if (snap.exists()) return snap.data() as UserProfile;
    const fresh = defaultProfile(id);
    await setDoc(doc(requireDb(), 'users', id), fresh);
    return fresh;
  }
  const raw = await AsyncStorage.getItem(PROFILE_KEY(id));
  if (!raw) return defaultProfile(id);
  // L'emoji et la couleur d'identité viennent toujours de la config
  // (non éditables dans l'app) — on ne garde du stockage que le reste.
  const stored = JSON.parse(raw) as UserProfile;
  return { ...stored, emoji: USERS[id].emoji, color: USERS[id].color };
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  if (isFirebaseEnabled) {
    await setDoc(doc(requireDb(), 'users', profile.id), profile, { merge: true });
  } else {
    await AsyncStorage.setItem(PROFILE_KEY(profile.id), JSON.stringify(profile));
  }
}
