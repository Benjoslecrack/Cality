import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { lerpColor } from '../lib/colorScale';
import { getMonthGrid, toDateKey } from '../lib/dateUtils';
import { COLORS } from '../theme/tokens';

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const CELL_SIZE = 10;
const CELL_GAP = 2;
const GRID_WIDTH = CELL_SIZE * 7 + CELL_GAP * 6;

type Props = {
  year: number;
  dailyReps: Map<string, number>;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
};

// Heatmap façon GitHub, sur les 12 mois : un mini calendrier par mois (même
// grille lundi-first que CalendarMonthScreen, cases hors-mois invisibles),
// intensité de couleur = volume de reps du jour relatif au max de l'année.
export function AnnualHeatmap({ year, dailyReps, selectedDateKey, onSelectDate }: Props) {
  const maxReps = useMemo(() => Math.max(0, ...Array.from(dailyReps.values())), [dailyReps]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-4 px-0.5 py-1">
      {MONTH_SHORT.map((label, monthIndex) => {
        const grid = getMonthGrid(new Date(year, monthIndex, 1));
        return (
          <View key={label} className="items-center">
            <Text className="mb-1 font-bodyMedium text-[10px] uppercase text-textMuted">{label}</Text>
            <View style={{ width: GRID_WIDTH, flexDirection: 'row', flexWrap: 'wrap', gap: CELL_GAP }}>
              {grid.map(({ date, inMonth }) => {
                if (!inMonth) {
                  return <View key={date.toISOString()} style={{ width: CELL_SIZE, height: CELL_SIZE }} />;
                }
                const dateKey = toDateKey(date);
                const reps = dailyReps.get(dateKey) ?? 0;
                const color =
                  reps === 0 ? COLORS.bgSurface : lerpColor(COLORS.accentDim, COLORS.neonMagenta, reps / maxReps);
                const isSelected = dateKey === selectedDateKey;

                return (
                  <Pressable key={dateKey} onPress={() => onSelectDate(dateKey)} hitSlop={2}>
                    <View
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        backgroundColor: color,
                        borderWidth: isSelected ? 1.5 : 0,
                        borderColor: COLORS.neonCyan,
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
