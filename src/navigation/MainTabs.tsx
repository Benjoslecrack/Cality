import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CalendarStack } from './CalendarStack';
import { ProgramsStack } from './ProgramsStack';
import { SkillsStack } from './SkillsStack';
import { TodayStack } from './TodayStack';

export type MainTabParamList = {
  Today: undefined;
  Calendar: undefined;
  Programs: undefined;
  Skills: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Today: 'today-outline',
  Calendar: 'calendar-outline',
  Programs: 'list-outline',
  Skills: 'trophy-outline',
  Profile: 'person-outline',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#0B0D10' },
        headerTintColor: '#F5F6F7',
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: '#16191D', borderTopColor: '#2A2F36' },
        tabBarActiveTintColor: '#F2545B',
        tabBarInactiveTintColor: '#9AA1AA',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Today" component={TodayStack} options={{ title: "Aujourd'hui", headerShown: false }} />
      <Tab.Screen name="Calendar" component={CalendarStack} options={{ title: 'Calendrier', headerShown: false }} />
      <Tab.Screen name="Programs" component={ProgramsStack} options={{ title: 'Programmes', headerShown: false }} />
      <Tab.Screen name="Skills" component={SkillsStack} options={{ title: 'Skills', headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil', headerShown: false }} />
    </Tab.Navigator>
  );
}
