import './src/lib/i18n';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from './src/theme/gluestack.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootTabs } from './src/navigation/RootTabs';

const queryClient = new QueryClient();

export default function App() {
  return (
    <GluestackUIProvider config={config}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <RootTabs />
            <StatusBar style="auto" />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
