import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarMonthScreen } from '../screens/calendar/CalendarMonthScreen';
import { DayDetailScreen } from '../screens/calendar/DayDetailScreen';
import { SessionPickerScreen } from '../screens/calendar/SessionPickerScreen';
import { WorkoutLogScreen } from '../screens/logs/WorkoutLogScreen';
import { AddLogExerciseScreen } from '../screens/logs/AddLogExerciseScreen';
import { GuidedSessionScreen } from '../screens/logs/GuidedSessionScreen';
import { SetFormScreen, type SetFormParams } from '../screens/logs/SetFormScreen';
import { COLORS } from '../theme/tokens';

export type CalendarStackParamList = {
  CalendarMonth: undefined;
  DayDetail: { dateKey: string };
  SessionPicker: { dateKey: string };
  WorkoutLog: { workoutLogId: string };
  AddLogExercise: { workoutLogId: string };
  GuidedSession: { workoutLogId: string };
  SetForm: SetFormParams;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export function CalendarStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bgNight },
        headerTintColor: COLORS.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.bgNight },
      }}
    >
      <Stack.Screen name="CalendarMonth" component={CalendarMonthScreen} options={{ title: 'Calendrier' }} />
      <Stack.Screen name="DayDetail" component={DayDetailScreen} />
      <Stack.Screen name="SessionPicker" component={SessionPickerScreen} options={{ title: 'Assigner une séance', presentation: 'modal' }} />
      <Stack.Screen name="WorkoutLog" component={WorkoutLogScreen} options={{ title: 'Séance' }} />
      <Stack.Screen
        name="AddLogExercise"
        component={AddLogExerciseScreen}
        options={{ title: 'Nouvel exercice', presentation: 'modal' }}
      />
      <Stack.Screen name="GuidedSession" component={GuidedSessionScreen} options={{ title: 'Mode guidé' }} />
      <Stack.Screen name="SetForm" component={SetFormScreen} options={{ title: 'Série', presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
