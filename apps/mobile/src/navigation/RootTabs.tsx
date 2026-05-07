import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, IndianRupee, Package, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as t } from '@growcold/tokens';
import { HomeScreen } from '../screens/HomeScreen';
import { PartiesScreen } from '../screens/PartiesScreen';
import { StockScreen } from '../screens/StockScreen';
import { MoneyScreen } from '../screens/MoneyScreen';

export type RootTabParamList = {
  Home: undefined;
  Stock: undefined;
  Money: undefined;
  Parties: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconComponent = typeof Home;

const TAB_ICONS: Record<string, IconComponent> = {
  Home,
  Stock: Package,
  Money: IndianRupee,
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
                  color={focused ? t.brandUi : t.textTertiary}
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
    backgroundColor: t.bgSurface,
    borderTopWidth: 1,
    borderTopColor: t.borderDefault,
    paddingTop: 6,
    shadowColor: t.textPrimary,
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
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    // No background — active state is conveyed by icon + label color only
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'NotoSans_400Regular',
    color: t.textTertiary,
  },
  labelActive: {
    color: t.brandUi,
    fontWeight: '600',
    fontFamily: 'NotoSans_600SemiBold',
  },
});

export function RootTabs() {
  const { t } = useTranslation('nav');

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Stock" component={StockScreen} options={{ title: t('stock') }} />
      <Tab.Screen name="Money" component={MoneyScreen} options={{ title: t('money') }} />
      <Tab.Screen name="Parties" component={PartiesScreen} options={{ title: t('parties') }} />
    </Tab.Navigator>
  );
}
