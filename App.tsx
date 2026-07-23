import './global.css';
import 'react-native-url-polyfill/auto';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from '@expo-google-fonts/pixelify-sans';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { AuthProvider } from './src/contexts/AuthContext';
import { RestTimerProvider } from './src/contexts/RestTimerContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { queryCachePersister, queryClient } from './src/lib/queryClient';
import { COLORS } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bgNight }} />;
  }

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryCachePersister,
          // Incrémenté pour purger un cache persisté corrompu : un Set
          // (user_skill_selection) sérialisé en JSON par AsyncStorage
          // redevient un objet vide {} à la réhydratation, cassant
          // `.has()`. Ce buster force un cache neuf plutôt que de tenter
          // de réhydrater l'ancien format.
          buster: 'v4-skill-sublevels-1',
        }}
        onSuccess={() => {
          // Rejoue les mutations mises en pause hors-ligne (créer un log,
          // valider une série...) une fois le cache restauré et la session
          // réseau prête.
          queryClient.resumePausedMutations();
        }}
      >
        <AuthProvider>
          <RestTimerProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </RestTimerProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
