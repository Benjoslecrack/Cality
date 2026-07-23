import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SkillsListScreen } from '../screens/skills/SkillsListScreen';
import { SkillDetailScreen } from '../screens/skills/SkillDetailScreen';
import { SkillSelectionScreen } from '../screens/skills/SkillSelectionScreen';
import { PhotoTimelineScreen } from '../screens/progress/PhotoTimelineScreen';
import { AddProgressPhotoScreen } from '../screens/progress/AddProgressPhotoScreen';

export type SkillsStackParamList = {
  SkillsList: undefined;
  SkillDetail: { skillId: string; title: string };
  SkillSelection: undefined;
  PhotoTimeline: undefined;
  AddProgressPhoto: undefined;
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
        component={SkillDetailScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen name="SkillSelection" component={SkillSelectionScreen} options={{ title: 'Mes skills actifs' }} />
      <Stack.Screen name="PhotoTimeline" component={PhotoTimelineScreen} options={{ title: 'Photos de progression' }} />
      <Stack.Screen
        name="AddProgressPhoto"
        component={AddProgressPhotoScreen}
        options={{ title: 'Ajouter une photo' }}
      />
    </Stack.Navigator>
  );
}
