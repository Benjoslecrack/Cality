import { supabase } from './supabase';
import { cancelLocalNotification, scheduleLocalNotification } from './notifications';

export type ReminderEntry = {
  id: string;
  scheduled_date: string; // 'YYYY-MM-DD'
  sessionName: string;
};

function reminderNotificationId(entryId: string): string {
  return `session-reminder-${entryId}`;
}

function reminderDate(scheduledDate: string, hour: number, minute: number): Date {
  const [y, m, d] = scheduledDate.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

async function fetchReminderPrefs(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('notify_session_reminder, session_reminder_hour, session_reminder_minute')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// (Re)planifie le rappel d'une séance de calendrier, ou l'annule si le
// réglage est désactivé — un seul point d'entrée pour ne pas dupliquer la
// lecture des préférences à chaque appelant (création, changement de statut,
// changement de réglage).
//
// N'échoue jamais vers l'appelant : appelé depuis des onSuccess de mutations
// calendrier (créer/planifier une séance...), une erreur ici (réseau,
// permission, Expo Go) ne doit jamais faire échouer l'action principale de
// l'utilisateur — au pire, pas de rappel programmé cette fois.
export async function scheduleSessionReminder(userId: string, entry: ReminderEntry): Promise<void> {
  try {
    const id = reminderNotificationId(entry.id);
    const prefs = await fetchReminderPrefs(userId);
    if (!prefs.notify_session_reminder) {
      await cancelLocalNotification(id);
      return;
    }
    await scheduleLocalNotification({
      id,
      title: 'Séance planifiée',
      body: `${entry.sessionName} prévue aujourd'hui`,
      date: reminderDate(entry.scheduled_date, prefs.session_reminder_hour, prefs.session_reminder_minute),
    });
  } catch (error) {
    console.warn('scheduleSessionReminder a échoué (ignoré) :', error);
  }
}

export async function cancelSessionReminder(entryId: string): Promise<void> {
  await cancelLocalNotification(reminderNotificationId(entryId)).catch((error) => {
    console.warn('cancelSessionReminder a échoué (ignoré) :', error);
  });
}

// Recalcule tous les rappels des séances encore programmées (statut
// 'planned') d'un coup : utilisé quand un réglage global change (activé/
// désactivé, heure modifiée) plutôt qu'une seule entrée — cf. brief "vérifie
// que les notifications sont bien annulées/recalculées".
type PlannedEntryRow = { id: string; scheduled_date: string; program_sessions: { name: string } | null };

export async function reconcileAllSessionReminders(userId: string, enabled: boolean): Promise<void> {
  try {
    const { data: entries, error } = await supabase
      .from('calendar_entries')
      .select('id, scheduled_date, program_sessions(name)')
      .eq('user_id', userId)
      .eq('status', 'planned')
      .returns<PlannedEntryRow[]>();
    if (error) throw error;

    if (!enabled) {
      await Promise.all(entries.map((entry) => cancelSessionReminder(entry.id)));
      return;
    }
    await Promise.all(
      entries.map((entry) =>
        scheduleSessionReminder(userId, {
          id: entry.id,
          scheduled_date: entry.scheduled_date,
          sessionName: entry.program_sessions?.name ?? 'Séance',
        })
      )
    );
  } catch (error) {
    console.warn('reconcileAllSessionReminders a échoué (ignoré) :', error);
  }
}
