import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { formatDayLabel, toDateKey } from '../lib/dateUtils';
import { COLORS } from '../theme/tokens';

type DateFieldProps = {
  label: string;
  dateKey: string;
  onChange: (dateKey: string) => void;
  maximumDate?: Date;
};

// Sur Android, DateTimePicker s'ouvre toujours en dialogue système (rendre le
// composant inline n'a pas de sens) : on l'ouvre de façon impérative. Sur iOS,
// on affiche le picker inline sous le champ jusqu'à ce que l'utilisateur ferme.
export function DateField({ label, dateKey, onChange, maximumDate = new Date() }: DateFieldProps) {
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [year, month, day] = dateKey.split('-').map(Number);
  const value = new Date(year, month - 1, day);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        maximumDate,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) onChange(toDateKey(selected));
        },
      });
    } else {
      setShowIosPicker(true);
    }
  };

  return (
    <View className="mb-4">
      <Text className="mb-1.5 font-bodyMedium text-sm text-textMuted">{label}</Text>
      <Pressable
        onPress={openPicker}
        className="min-h-11 justify-center rounded-xl border border-textMuted/25 bg-surface px-4 py-3"
      >
        <Text className="font-body text-base text-text">{formatDayLabel(dateKey)}</Text>
      </Pressable>

      {showIosPicker ? (
        <View className="mt-2 rounded-xl bg-surface p-2">
          <DateTimePicker
            value={value}
            mode="date"
            display="inline"
            maximumDate={maximumDate}
            themeVariant="dark"
            accentColor={COLORS.neonMagenta}
            onChange={(event, selected) => {
              if (event.type === 'set' && selected) onChange(toDateKey(selected));
            }}
          />
          <Pressable onPress={() => setShowIosPicker(false)} className="mt-1 items-center rounded-lg py-2">
            <Text className="font-bodySemibold text-sm text-accent">Terminé</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
