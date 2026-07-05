import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isFirebaseEnabled, requireAuth } from '@/services/firebase';
import { defaultProfile, loadProfile, saveProfile } from '@/services/data/profiles';
import type { UserId, UserProfile } from '@/types/models';

interface AuthState {
  userId: UserId | null;
  profile: UserProfile | null;
  hydrated: boolean;
  /** Connexion : PIN en mode démo, email+mot de passe si Firebase est actif. */
  login: (userId: UserId, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const EMAILS: Record<UserId, string | undefined> = {
  stanne: process.env.EXPO_PUBLIC_STANNE_EMAIL,
  tissam: process.env.EXPO_PUBLIC_TISSAM_EMAIL,
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      profile: null,
      hydrated: false,

      login: async (userId, password) => {
        if (isFirebaseEnabled) {
          const email = EMAILS[userId];
          if (!email) throw new Error(`Email non configuré pour ${userId} (voir .env)`);
          await signInWithEmailAndPassword(requireAuth(), email, password);
        } else if (password.length < 4) {
          throw new Error('Code à 4 chiffres minimum');
        }
        const profile = await loadProfile(userId);
        set({ userId, profile });
      },

      logout: async () => {
        if (isFirebaseEnabled) await signOut(requireAuth()).catch(() => {});
        set({ userId: null, profile: null });
      },

      refreshProfile: async () => {
        const { userId } = get();
        if (!userId) return;
        set({ profile: await loadProfile(userId) });
      },

      updateProfile: async (patch) => {
        const { userId, profile } = get();
        if (!userId) return;
        const next: UserProfile = { ...(profile ?? defaultProfile(userId)), ...patch, id: userId };
        await saveProfile(next);
        set({ profile: next });
      },
    }),
    {
      name: 'tisstan:auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ userId: s.userId, profile: s.profile }),
      onRehydrateStorage: () => (state) => {
        useAuth.setState({ hydrated: true });
        if (state?.userId) void state.refreshProfile?.();
      },
    },
  ),
);

/** L'autre utilisateur (pour le classement, le mur partagé…). */
export function otherUser(userId: UserId): UserId {
  return userId === 'stanne' ? 'tissam' : 'stanne';
}
