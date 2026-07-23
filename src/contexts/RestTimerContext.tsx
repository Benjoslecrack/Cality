import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

type RestTimerValue = {
  isActive: boolean;
  isFinished: boolean;
  exerciseName: string | null;
  totalSeconds: number;
  remainingSeconds: number;
  start: (seconds: number, exerciseName: string) => void;
  addTime: (deltaSeconds: number) => void;
  skip: () => void;
};

const RestTimerContext = createContext<RestTimerValue | undefined>(undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let hasCheckedPermission = false;

// Demande la permission une seule fois par session, en silence si refusée ou
// sur une plateforme qui ne supporte pas les notifications programmées (web) :
// le décompte visuel + le retour haptique restent la base fonctionnelle,
// la notification est un filet de sécurité si le téléphone est verrouillé.
async function ensureNotificationPermission() {
  if (hasCheckedPermission) return;
  hasCheckedPermission = true;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // ignoré volontairement
  }
}

// Repose sur un timestamp de fin absolu (pas un décompte par tick) : le temps
// restant affiché reste exact même si le thread JS a été throttled/suspendu
// pendant que l'app était en arrière-plan.
export function RestTimerProvider({ children }: PropsWithChildren) {
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const notificationIdRef = useRef<string | null>(null);
  const hasFiredHapticRef = useRef(false);

  const cancelScheduledNotification = useCallback(() => {
    const id = notificationIdRef.current;
    notificationIdRef.current = null;
    if (id) {
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    }
  }, []);

  const scheduleEndNotification = useCallback((seconds: number, name: string) => {
    ensureNotificationPermission().then(() => {
      Notifications.scheduleNotificationAsync({
        content: { title: 'Repos terminé', body: `${name} — série suivante`, sound: true },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false },
      })
        .then((id) => {
          notificationIdRef.current = id;
        })
        .catch(() => {
          // notifications indisponibles sur cette plateforme/permission refusée
        });
    });
  }, []);

  const start = useCallback(
    (seconds: number, name: string) => {
      cancelScheduledNotification();
      hasFiredHapticRef.current = false;
      setTotalSeconds(seconds);
      setExerciseName(name);
      setRemainingSeconds(seconds);
      setIsFinished(false);
      setEndTimestamp(Date.now() + seconds * 1000);
      if (seconds > 0) scheduleEndNotification(seconds, name);
    },
    [cancelScheduledNotification, scheduleEndNotification]
  );

  const addTime = useCallback(
    (deltaSeconds: number) => {
      setEndTimestamp((current) => {
        if (current == null) return current;
        const next = Math.max(Date.now(), current + deltaSeconds * 1000);
        const remaining = Math.max(0, Math.round((next - Date.now()) / 1000));
        setTotalSeconds((total) => Math.max(1, total + deltaSeconds));
        if (exerciseName) {
          cancelScheduledNotification();
          if (remaining > 0) scheduleEndNotification(remaining, exerciseName);
        }
        return next;
      });
    },
    [cancelScheduledNotification, scheduleEndNotification, exerciseName]
  );

  const skip = useCallback(() => {
    cancelScheduledNotification();
    setEndTimestamp(null);
    setIsFinished(false);
    setRemainingSeconds(0);
  }, [cancelScheduledNotification]);

  useEffect(() => {
    if (endTimestamp == null) return;

    const tick = () => {
      const remaining = Math.max(0, Math.round((endTimestamp - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0 && !hasFiredHapticRef.current) {
        hasFiredHapticRef.current = true;
        setIsFinished(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endTimestamp]);

  const isActive = endTimestamp != null && !isFinished;

  return (
    <RestTimerContext.Provider
      value={{ isActive, isFinished, exerciseName, totalSeconds, remainingSeconds, start, addTime, skip }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer() {
  const context = useContext(RestTimerContext);
  if (!context) throw new Error('useRestTimer doit être utilisé dans un <RestTimerProvider>');
  return context;
}
