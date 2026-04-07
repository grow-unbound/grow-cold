import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { AppHeader } from '../components/AppHeader';

export type RootTabParamList = {
  Home: undefined;
  Inventory: undefined;
  Parties: undefined;
  Receipts: undefined;
  Payments: undefined;
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
function ReceiptsScreen() {
  return <PlaceholderScreen titleKey="receipts" />;
}
function PaymentsScreen() {
  return <PlaceholderScreen titleKey="payments" />;
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
        name="Receipts"
        component={ReceiptsScreen}
        options={{ title: t('receipts') }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{ title: t('payments') }}
      />
    </Tab.Navigator>
  );
}
