import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { AppHeader } from '../components/AppHeader';

export type RootTabParamList = {
  Home: undefined;
  Inventory: undefined;
  Parties: undefined;
  Transactions: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function HomeScreen() {
  return <PlaceholderScreen titleKey="home" />;
}
function InventoryScreen() {
  return <PlaceholderScreen titleKey="inventory" />;
}
function PartiesScreen() {
  return <PlaceholderScreen titleKey="parties" />;
}
function TransactionsScreen() {
  return <PlaceholderScreen titleKey="transactions" />;
}

export function RootTabs() {
  const { t } = useTranslation('nav');

  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <AppHeader />,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{ title: t('inventory') }}
      />
      <Tab.Screen name="Parties" component={PartiesScreen} options={{ title: t('parties') }} />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: t('transactions') }}
      />
    </Tab.Navigator>
  );
}
