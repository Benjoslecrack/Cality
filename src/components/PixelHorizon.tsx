import { View } from 'react-native';
import { COLORS } from '../theme/tokens';

// Motif décoratif discret : soleil couchant + ligne d'horizon + deux palmiers
// penchés, en pixel art. Utilisé en petit élément d'ambiance sur l'écran
// Aujourd'hui (jamais en illustration principale).
const HORIZON_PIXELS = [
  '.............111................',
  '............11111...............',
  '...........1111111..............',
  '...........1111111..............',
  '................................',
  '22222222222222222222222222222222',
  '..3.3......................3.3..',
  '.33333....................33333.',
  '...3........................3...',
  '...3........................3...',
  '....3......................3....',
  '................................',
];

const PIXEL_COLORS: Record<string, string> = {
  '1': COLORS.sunsetOrange,
  '2': COLORS.neonCyan,
  '3': COLORS.bgNight,
};

type PixelHorizonProps = { pixelSize?: number };

export function PixelHorizon({ pixelSize = 3 }: PixelHorizonProps) {
  return (
    <View style={{ opacity: 0.7 }}>
      {HORIZON_PIXELS.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.split('').map((char, x) => (
            <View
              key={x}
              style={{
                width: pixelSize,
                height: pixelSize,
                backgroundColor: PIXEL_COLORS[char] ?? 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
