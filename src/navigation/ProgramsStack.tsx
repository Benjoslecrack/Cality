import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SessionExerciseInput } from '../hooks/useSessionExercises';
import { ProgramsListScreen } from '../screens/programs/ProgramsListScreen';
import { ProgramFormScreen } from '../screens/programs/ProgramFormScreen';
import { ProgramDetailScreen } from '../screens/programs/ProgramDetailScreen';
import { SessionFormScreen } from '../screens/programs/SessionFormScreen';
import { SessionEditorScreen } from '../screens/programs/SessionEditorScreen';
import { ExerciseFormScreen } from '../screens/programs/ExerciseFormScreen';

export type ProgramsStackParamList = {
  ProgramsList: undefined;
  ProgramForm: { programId?: string; initialName?: string; initialDescription?: string | null };
  ProgramDetail: { programId: string; programName: string };
  SessionForm: { programId: string; sessionId?: string; initialName?: string };
  SessionEditor: { programSessionId: string; sessionName: string };
  ExerciseForm: {
    programSessionId: string;
    exerciseId?: string;
    initialValues?: SessionExerciseInput;
  };
};

const Stack = createNativeStackNavigator<ProgramsStackParamList>();

export function ProgramsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0D10' },
        headerTintColor: '#F5F6F7',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0B0D10' },
      }}
    >
      <Stack.Screen name="ProgramsList" component={ProgramsListScreen} options={{ title: 'Programmes' }} />
      <Stack.Screen name="ProgramForm" component={ProgramFormScreen} options={{ title: 'Programme', presentation: 'modal' }} />
      <Stack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={({ route }) => ({ title: route.params.programName })}
      />
      <Stack.Screen name="SessionForm" component={SessionFormScreen} options={{ title: 'Séance', presentation: 'modal' }} />
      <Stack.Screen
        name="SessionEditor"
        component={SessionEditorScreen}
        options={({ route }) => ({ title: route.params.sessionName })}
      />
      <Stack.Screen
        name="ExerciseForm"
        component={ExerciseFormScreen}
        options={{ title: 'Exercice', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
