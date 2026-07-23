import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RestTimerBar } from '../components/RestTimerBar';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../theme/tokens';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.bgBase,
    card: COLORS.bgSurface,
    border: COLORS.bgSurface,
    primary: COLORS.accent,
    text: COLORS.textPrimary,
  },
};

export function RootNavigator() {
  const { session, loading } = useAuth();
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={navigationTheme}>
        {session ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
      {session ? (
        <>
          <View style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 8 }} pointerEvents="box-none">
            <SyncStatusBadge />
          </View>
          {/* Positionné juste au-dessus de la tab bar (hauteur par défaut ~49 +
          zone de sécurité) : le minuteur reste visible quel que soit l'onglet. */}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 49 }} pointerEvents="box-none">
            <RestTimerBar />
          </View>
        </>
      ) : null}
    </View>
  );
}
