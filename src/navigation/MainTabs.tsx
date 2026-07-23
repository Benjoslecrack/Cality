import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ComingSoonScreen } from '../screens/ComingSoonScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProgramsStack } from './ProgramsStack';

export type MainTabParamList = {
  Today: undefined;
  Calendar: undefined;
  Programs: undefined;
  Skills: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function TodayScreen() {
  return <ComingSoonScreen title="Aujourd'hui" />;
}
function CalendarScreen() {
  return <ComingSoonScreen title="Calendrier" />;
}
function SkillsScreen() {
  return <ComingSoonScreen title="Skills" />;
}

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
      <Tab.Screen name="Today" component={TodayScreen} options={{ title: "Aujourd'hui" }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendrier' }} />
      <Tab.Screen name="Programs" component={ProgramsStack} options={{ title: 'Programmes', headerShown: false }} />
      <Tab.Screen name="Skills" component={SkillsScreen} options={{ title: 'Skills' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil', headerShown: false }} />
    </Tab.Navigator>
  );
}
