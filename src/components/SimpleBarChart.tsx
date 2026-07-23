import { Text, View } from 'react-native';

export type ChartPoint = { label: string; value: number };

// Graphique en barres minimaliste (pas de lib de charting) : suffisant pour
// visualiser une tendance dans le temps sur les derniers points loggés.
export function SimpleBarChart({ points, unit }: { points: ChartPoint[]; unit?: string }) {
  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <View>
      <View className="h-32 flex-row items-end gap-1.5">
        {points.map((point, index) => {
          const heightPct = Math.max((point.value / max) * 100, 4);
          const isLast = index === points.length - 1;
          return (
            <View key={`${point.label}-${index}`} className="h-full flex-1 items-center justify-end">
              <Text className="mb-1 text-[10px] text-textMuted">{point.value}</Text>
              <View
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-md ${isLast ? 'bg-accent' : 'bg-textMuted/25'}`}
              />
            </View>
          );
        })}
      </View>
      <View className="mt-1 flex-row gap-1.5">
        {points.map((point, index) => (
          <View key={`${point.label}-label-${index}`} className="flex-1 items-center">
            <Text className="text-[10px] text-textMuted" numberOfLines={1}>
              {point.label}
            </Text>
          </View>
        ))}
      </View>
      {unit ? <Text className="mt-2 text-xs text-textMuted">Unité : {unit}</Text> : null}
    </View>
  );
}
