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
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { AuthProvider } from './src/contexts/AuthContext';
import { RestTimerProvider } from './src/contexts/RestTimerContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { queryCachePersister, queryClient } from './src/lib/queryClient';
import { COLORS } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: COLORS.bgBase }} />;
  }

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: queryCachePersister }}
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
