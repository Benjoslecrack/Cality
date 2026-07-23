import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TodayScreen } from '../screens/TodayScreen';
import { SessionPickerScreen } from '../screens/calendar/SessionPickerScreen';
import { WorkoutLogScreen } from '../screens/logs/WorkoutLogScreen';
import { AddLogExerciseScreen } from '../screens/logs/AddLogExerciseScreen';
import { GuidedSessionScreen } from '../screens/logs/GuidedSessionScreen';
import { SetFormScreen, type SetFormParams } from '../screens/logs/SetFormScreen';
import { COLORS } from '../theme/tokens';

export type TodayStackParamList = {
  TodayHome: undefined;
  SessionPicker: { dateKey: string };
  WorkoutLog: { workoutLogId: string };
  AddLogExercise: { workoutLogId: string };
  GuidedSession: { workoutLogId: string };
  SetForm: SetFormParams;
};

const Stack = createNativeStackNavigator<TodayStackParamList>();

export function TodayStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bgBase },
        headerTintColor: COLORS.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: COLORS.bgBase },
      }}
    >
      <Stack.Screen name="TodayHome" component={TodayScreen} options={{ title: "Aujourd'hui" }} />
      <Stack.Screen
        name="SessionPicker"
        component={SessionPickerScreen}
        options={{ title: 'Assigner une séance', presentation: 'modal' }}
      />
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
