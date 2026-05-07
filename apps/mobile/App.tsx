import './src/lib/i18n';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from './src/theme/gluestack.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStack } from './src/navigation/RootStack';
import {
  useFonts,
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import {
  NotoSerif_400Regular,
  NotoSerif_500Medium,
  NotoSerif_600SemiBold,
  NotoSerif_700Bold,
} from '@expo-google-fonts/noto-serif';
import {
  NotoSansMono_400Regular,
  NotoSansMono_500Medium,
} from '@expo-google-fonts/noto-sans-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 45_000,
      retry: 1,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
    NotoSerif_400Regular,
    NotoSerif_500Medium,
    NotoSerif_600SemiBold,
    NotoSerif_700Bold,
    NotoSansMono_400Regular,
    NotoSansMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GluestackUIProvider config={config}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <RootStack />
            <StatusBar style="auto" />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
