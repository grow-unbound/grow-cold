import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GlobalSearchScreen } from '../screens/GlobalSearchScreen';
import { LotDetailsScreen } from '../screens/LotDetailsScreen';
import { PartyDetailsScreen } from '../screens/PartyDetailsScreen';
import { TransactionDetailScreen } from '../screens/TransactionDetailScreen';
import { RootTabs } from './RootTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={RootTabs} />
      <Stack.Screen name="Search" component={GlobalSearchScreen} />
      <Stack.Screen name="LotDetail" component={LotDetailsScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="PartyDetail" component={PartyDetailsScreen} />
    </Stack.Navigator>
  );
}
