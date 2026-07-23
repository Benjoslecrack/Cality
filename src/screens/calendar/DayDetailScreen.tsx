import { useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalendarEntryCard } from '../../components/CalendarEntryCard';
import { useDayEntriesQuery } from '../../hooks/useCalendarEntries';
import { formatDayLabel } from '../../lib/dateUtils';
import type { CalendarStackParamList } from '../../navigation/CalendarStack';

type Props = NativeStackScreenProps<CalendarStackParamList, 'DayDetail'>;

export function DayDetailScreen({ navigation, route }: Props) {
  const { dateKey } = route.params;
  const { data: entries, isLoading } = useDayEntriesQuery(dateKey);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: formatDayLabel(dateKey),
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('SessionPicker', { dateKey })} hitSlop={8}>
          <Ionicons name="add" size={26} color="#F5F6F7" />
        </Pressable>
      ),
    });
  }, [navigation, dateKey]);

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
        contentContainerClassName="px-6 py-6 gap-3"
        ListEmptyComponent={
          <View className="mt-16 items-center px-6">
            <Text className="mb-2 text-lg font-semibold text-text">Aucune séance prévue</Text>
            <Text className="text-center text-textMuted">
              Assigne une séance à ce jour avec le bouton + en haut à droite.
            </Text>
          </View>
        }
        renderItem={({ item }) => <CalendarEntryCard entry={item} />}
      />
    </View>
  );
}
