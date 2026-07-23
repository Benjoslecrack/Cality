import * as Haptics from 'expo-haptics';
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

// Pas de notification programmée : depuis le SDK 53, expo-notifications lève
// une erreur dure dans Expo Go sur Android dès qu'on touche quasiment
// n'importe quelle API du module (pas seulement le push distant), sans moyen
// de l'intercepter en JS. Le décompte visuel (basé sur un timestamp de fin
// absolu, donc fiable même si le thread JS est throttled) + le retour
// haptique en premier plan restent la base fonctionnelle dans Expo Go ;
// une vraie notification "app en arrière-plan/tél verrouillé" demanderait un
// dev client (EAS build) plutôt qu'Expo Go.
export function RestTimerProvider({ children }: PropsWithChildren) {
  const [endTimestamp, setEndTimestamp] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const hasFiredHapticRef = useRef(false);

  const start = useCallback((seconds: number, name: string) => {
    hasFiredHapticRef.current = false;
    setTotalSeconds(seconds);
    setExerciseName(name);
    setRemainingSeconds(seconds);
    setIsFinished(false);
    setEndTimestamp(Date.now() + seconds * 1000);
  }, []);

  const addTime = useCallback((deltaSeconds: number) => {
    setEndTimestamp((current) => {
      if (current == null) return current;
      const next = Math.max(Date.now(), current + deltaSeconds * 1000);
      setTotalSeconds((total) => Math.max(1, total + deltaSeconds));
      return next;
    });
  }, []);

  const skip = useCallback(() => {
    setEndTimestamp(null);
    setIsFinished(false);
    setRemainingSeconds(0);
  }, []);

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
