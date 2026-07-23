import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {session ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
