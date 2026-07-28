import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileScreen } from '../screens/ProfileScreen';
import { COLORS } from '../theme/tokens';
import { CalendarStack } from './CalendarStack';
import { ProgramsStack } from './ProgramsStack';
import { SkillsStack, type SkillsStackParamList } from './SkillsStack';
import { TodayStack } from './TodayStack';

export type MainTabParamList = {
  Today: undefined;
  Calendar: undefined;
  Programs: undefined;
  // NavigatorScreenParams : permet de naviguer depuis Profil directement vers
  // un écran précis de l'onglet Skills (ex. la sélection des skills actifs).
  Skills: NavigatorScreenParams<SkillsStackParamList> | undefined;
  Profile: undefined;
};

// material-top-tabs (positionné en bas) plutôt que bottom-tabs : donne le
// swipe horizontal entre onglets nativement (via react-native-pager-view),
// en gardant le même rendu visuel qu'une tab bar classique.
const Tab = createMaterialTopTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Today: 'today-outline',
  Calendar: 'calendar-outline',
  Programs: 'list-outline',
  Skills: 'trophy-outline',
  Profile: 'person-outline',
};

const LABELS: Record<keyof MainTabParamList, string> = {
  Today: "Aujourd'hui",
  Calendar: 'Calendrier',
  Programs: 'Programmes',
  Skills: 'Skills',
  Profile: 'Profil',
};

export function MainTabs() {
  // material-top-tabs ne gère pas la zone de sécurité basse tout seul
  // (contrairement à bottom-tabs) : à ajouter à la main.
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        swipeEnabled: true,
        tabBarShowIcon: true,
        tabBarIndicatorStyle: { height: 0 },
        tabBarActiveTintColor: COLORS.neonCyan,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.bgSurface,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: insets.bottom,
          height: 49 + insets.bottom,
        },
        tabBarItemStyle: { flexDirection: 'column' },
        tabBarLabelStyle: { fontSize: 11, textTransform: 'none', margin: 0 },
        tabBarIcon: ({ color }) => (
          <Ionicons name={ICONS[route.name as keyof MainTabParamList]} color={color} size={22} />
        ),
        tabBarLabel: LABELS[route.name as keyof MainTabParamList],
      })}
    >
      <Tab.Screen name="Today" component={TodayStack} />
      <Tab.Screen name="Calendar" component={CalendarStack} />
      <Tab.Screen name="Programs" component={ProgramsStack} />
      <Tab.Screen name="Skills" component={SkillsStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
