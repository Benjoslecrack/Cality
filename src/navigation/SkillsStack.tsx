import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SkillsListScreen } from '../screens/skills/SkillsListScreen';
import { ProgressHistoryScreen } from '../screens/progress/ProgressHistoryScreen';
import type { SkillKey } from '../types/database';

export type SkillsStackParamList = {
  SkillsList: undefined;
  SkillDetail: { skillKey: SkillKey; title: string };
};

const Stack = createNativeStackNavigator<SkillsStackParamList>();

export function SkillsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0D10' },
        headerTintColor: '#F5F6F7',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0B0D10' },
      }}
    >
      <Stack.Screen name="SkillsList" component={SkillsListScreen} options={{ title: 'Skills' }} />
      <Stack.Screen
        name="SkillDetail"
        component={ProgressHistoryScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
