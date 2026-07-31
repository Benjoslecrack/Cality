import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { COLORS } from '../theme/tokens';

// `appOwnership` (déprécié, mais seul champ à distinguer précisément Expo Go
// d'un dev client) vaut 'expo' uniquement dans Expo Go ; un dev client ou un
// build standalone vaut null et supporte expo-notifications normalement.
export const isExpoGo = Constants.appOwnership === 'expo';

// Le simple `import`/`require` statique d'expo-notifications suffit à faire
// planter Expo Go depuis le SDK 53 ("Android Push notifications ... removed
// from Expo Go"), avant même d'appeler une seule fonction du module — ce
// n'est pas juste un appel d'API à éviter, c'est le chargement du module lui
// même. On ne le require donc que si on n'est pas dans Expo Go, jamais de
// `import` statique en haut de ce fichier.
type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;
if (!isExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require('expo-notifications');
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Cality',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: COLORS.neonMagenta,
    });
  }
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

// 'unsupported' : valeur ajoutée par l'app (pas du vocabulaire
// expo-notifications) pour Expo Go, où la fonctionnalité est indisponible
// plutôt que refusée — distinction utile pour l'écran de réglages.
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!Notifications) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

type ScheduleOptions = {
  /** Identifiant stable (ex. dérivé d'un calendar_entry.id) : reprogrammer
   * avec le même id remplace silencieusement toute notification existante,
   * pas besoin de suivre les identifiants générés côté app. */
  id: string;
  title: string;
  body: string;
  date: Date;
};

// No-op silencieux dans Expo Go ou si la permission n'est pas accordée —
// jamais d'erreur remontée à l'appelant pour ce module, cohérent avec le
// choix de ne jamais bloquer l'usage normal de l'app sans notifications.
export async function scheduleLocalNotification({ id, title, body, date }: ScheduleOptions): Promise<void> {
  if (!Notifications) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  if (date.getTime() <= Date.now()) return; // une date déjà passée ne serait jamais délivrée

  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function cancelLocalNotification(id: string): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

// Pré-demande "douce" avant la vraie boîte de dialogue OS, déclenchée après
// la création du premier programme ou de la première séance planifiée (pas
// au premier lancement à froid, cf. brief) : sur iOS la permission ne peut
// être redemandée qu'une fois par l'app (au-delà, seul le menu Réglages du
// téléphone permet de revenir dessus), donc autant ne présenter le vrai
// dialogue OS que si l'utilisateur a déjà dit oui à cet écran contextuel.
// Ne fait rien si l'utilisateur a déjà répondu (accepté/refusé) ou dans
// Expo Go.
export function promptForNotificationPermissionIfRelevant(): void {
  if (!Notifications) return;
  getNotificationPermissionStatus().then((status) => {
    if (status !== 'undetermined') return;
    Alert.alert(
      'Active les rappels ?',
      'Reçois un rappel pour tes séances planifiées, et une notification quand tu bats un record ou débloques un palier.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Activer', onPress: () => requestNotificationPermission() },
      ]
    );
  });
}

export async function sendImmediateNotification({ title, body }: { title: string; body: string }): Promise<void> {
  if (!Notifications) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
