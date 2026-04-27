import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { ArrowLeftRight, Home, Package, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { PartiesScreen } from '../screens/PartiesScreen';
import { StockScreen } from '../screens/StockScreen';
import { MoneyScreen } from '../screens/MoneyScreen';

export type RootTabParamList = {
  Home: undefined;
  Inventory: undefined;
  Transactions: undefined;
  Parties: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconComponent = typeof Home;

const TAB_ICONS: Record<string, IconComponent> = {
  Home,
  Inventory: Package,
  Transactions: ArrowLeftRight,
  Parties: Users,
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const Icon = TAB_ICONS[route.name];

        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
          >
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              {Icon ? (
                <Icon
                  size={20}
                  color={focused ? '#00B14F' : '#9CA3AF'}
                  strokeWidth={focused ? 2.25 : 1.75}
                />
              ) : null}
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  iconPill: {
    width: 48,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: '#E8F8EF',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  labelActive: {
    color: '#00B14F',
    fontWeight: '600',
  },
});

function InventoryScreen() {
  return <StockScreen />;
}
function TransactionsScreen() {
  return <MoneyScreen />;
}

export function RootTabs() {
  const { t } = useTranslation('nav');

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ title: t('stock') }} />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{ title: t('payments') }}
      />
      <Tab.Screen name="Parties" component={PartiesScreen} options={{ title: t('parties') }} />
    </Tab.Navigator>
  );
}
