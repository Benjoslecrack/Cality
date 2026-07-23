import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TodayScreen } from '../screens/TodayScreen';
import { SessionPickerScreen } from '../screens/calendar/SessionPickerScreen';

export type TodayStackParamList = {
  TodayHome: undefined;
  SessionPicker: { dateKey: string };
};

const Stack = createNativeStackNavigator<TodayStackParamList>();

export function TodayStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0D10' },
        headerTintColor: '#F5F6F7',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0B0D10' },
      }}
    >
      <Stack.Screen name="TodayHome" component={TodayScreen} options={{ title: "Aujourd'hui" }} />
      <Stack.Screen
        name="SessionPicker"
        component={SessionPickerScreen}
        options={{ title: 'Assigner une séance', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
