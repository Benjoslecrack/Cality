import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { CalendarEntryCard } from '../components/CalendarEntryCard';
import { useTodayEntriesQuery } from '../hooks/useCalendarEntries';
import { formatDayLabel, todayDateKey } from '../lib/dateUtils';

type Props = {
  navigation: { navigate: (screen: 'SessionPicker', params: { dateKey: string }) => void };
};

export function TodayScreen({ navigation }: Props) {
  const dateKey = todayDateKey();
  const { data: entries, isLoading } = useTodayEntriesQuery();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#F2545B" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 pb-6 pt-4 gap-3"
        ListHeaderComponent={
          <Text className="mb-4 text-2xl font-bold capitalize text-text">{formatDayLabel(dateKey)}</Text>
        }
        ListEmptyComponent={
          <View className="mt-8 items-center px-6">
            <Text className="mb-2 text-lg font-semibold text-text">Aucune séance prévue aujourd'hui</Text>
            <Text className="mb-6 text-center text-textMuted">
              Planifie une séance pour aujourd'hui ou repose-toi !
            </Text>
          </View>
        }
        renderItem={({ item }) => <CalendarEntryCard entry={item} />}
        ListFooterComponent={
          <View className="mt-4">
            <Button label="Planifier une séance" variant="secondary" onPress={() => navigation.navigate('SessionPicker', { dateKey })} />
          </View>
        }
      />
    </View>
  );
}
