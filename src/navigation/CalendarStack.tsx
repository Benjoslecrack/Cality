import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarMonthScreen } from '../screens/calendar/CalendarMonthScreen';
import { DayDetailScreen } from '../screens/calendar/DayDetailScreen';
import { SessionPickerScreen } from '../screens/calendar/SessionPickerScreen';

export type CalendarStackParamList = {
  CalendarMonth: undefined;
  DayDetail: { dateKey: string };
  SessionPicker: { dateKey: string };
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
    </Stack.Navigator>
  );
}
