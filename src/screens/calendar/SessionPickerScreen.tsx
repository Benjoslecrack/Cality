import { ActivityIndicator, Alert, Pressable, SectionList, Text, View } from 'react-native';
import { useCreateCalendarEntry } from '../../hooks/useCalendarEntries';
import { useProgramsWithSessionsQuery } from '../../hooks/useProgramsWithSessions';
import { formatDayLabel } from '../../lib/dateUtils';
import { COLORS } from '../../theme/tokens';

type Props = {
  route: { params: { dateKey: string } };
  navigation: { goBack: () => void };
};

export function SessionPickerScreen({ navigation, route }: Props) {
  const { dateKey } = route.params;
  const { data: programs, isLoading } = useProgramsWithSessionsQuery();
  const createEntry = useCreateCalendarEntry();

  const handlePick = (programSessionId: string) => {
    createEntry.mutate(
      { programSessionId, scheduledDate: dateKey },
      {
        onSuccess: () => navigation.goBack(),
        onError: (error) => Alert.alert('Erreur', (error as Error).message),
      }
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.neonCyan} />
      </View>
    );
  }

  const sections = (programs ?? [])
    .filter((program) => program.program_sessions.length > 0)
    .map((program) => ({ title: program.name, data: program.program_sessions }));

  return (
    <View className="flex-1 bg-background">
      <Text className="px-6 pb-2 pt-4 text-textMuted">Assigner une séance au {formatDayLabel(dateKey).toLowerCase()}</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 pb-6 gap-2"
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View className="mt-16 items-center px-6">
            <Text className="mb-2 text-lg font-semibold text-text">Aucun programme avec séances</Text>
            <Text className="text-center text-textMuted">
              Crée d'abord un programme et une séance dans l'onglet Programmes.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text className="mb-1 mt-4 text-sm font-semibold uppercase text-textMuted">{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePick(item.id)}
            className="mb-2 rounded-xl border border-border bg-surface px-4 py-3"
          >
            <Text className="text-base text-text">{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
