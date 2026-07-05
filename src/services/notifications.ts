import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface ReminderDef {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
}

export const DAILY_REMINDERS: ReminderDef[] = [
  { id: 'weigh', title: '⚖️ Pesée du matin', body: 'Monte sur la balance et note ton poids.', hour: 7, minute: 30 },
  { id: 'breakfast', title: '🍳 Petit déjeuner', body: 'Pense à enregistrer ton premier repas.', hour: 8, minute: 30 },
  { id: 'hydration', title: '💧 Hydratation', body: 'Où en es-tu sur tes verres d’eau ?', hour: 14, minute: 0 },
  { id: 'workout', title: '💪 Séance du jour', body: 'C’est l’heure de bouger — ta séance t’attend.', hour: 17, minute: 30 },
  { id: 'dinner', title: '🍽️ Dîner', body: 'Enregistre ton dîner pour compléter ta journée.', hour: 20, minute: 0 },
  { id: 'sleep', title: '😴 Routine du soir', body: 'Prépare ta nuit : écrans off, objectif 8 h.', hour: 22, minute: 15 },
];

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** Programme les rappels quotidiens locaux (pesée, repas, sport, eau, sommeil). */
export async function scheduleDailyReminders(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily', {
      name: 'Rappels quotidiens',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of DAILY_REMINDERS) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: r.hour,
        minute: r.minute,
      },
    });
  }
  return true;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
