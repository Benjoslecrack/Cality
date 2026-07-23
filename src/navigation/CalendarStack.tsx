import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarMonthScreen } from '../screens/calendar/CalendarMonthScreen';
import { DayDetailScreen } from '../screens/calendar/DayDetailScreen';
import { SessionPickerScreen } from '../screens/calendar/SessionPickerScreen';
import { WorkoutLogScreen } from '../screens/logs/WorkoutLogScreen';
import { AddLogExerciseScreen } from '../screens/logs/AddLogExerciseScreen';
import { SetFormScreen, type SetFormParams } from '../screens/logs/SetFormScreen';

export type CalendarStackParamList = {
  CalendarMonth: undefined;
  DayDetail: { dateKey: string };
  SessionPicker: { dateKey: string };
  WorkoutLog: { workoutLogId: string };
  AddLogExercise: { workoutLogId: string };
  SetForm: SetFormParams;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export function CalendarStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0D10' },
        headerTintColor: '#F5F6F7',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0B0D10' },
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
      <Stack.Screen name="SetForm" component={SetFormScreen} options={{ title: 'Série', presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
