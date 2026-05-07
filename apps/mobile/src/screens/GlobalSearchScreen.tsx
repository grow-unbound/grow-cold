import { Box, Pressable, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { colors as gc } from '@growcold/tokens';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDebouncedValue } from '../features/home/useDebouncedValue';
import { runGlobalSearchNative } from '../lib/global-search-native';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';
import { useWarehouseStore } from '../stores/warehouse-store';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export function GlobalSearchScreen({ navigation }: Props) {
  const { t } = useTranslation('search');
  const insets = useSafeAreaInsets();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim(), 300);

  const enabled = warehouseId.length > 0 && supabase !== null && debounced.length >= 2;

  const q = useQuery({
    queryKey: ['global-search-screen', warehouseId, debounced],
    enabled,
    queryFn: () => runGlobalSearchNative(supabase!, warehouseId, debounced),
  });

  const goBack = useCallback(() => {
    void Haptics.selectionAsync();
    navigation.goBack();
  }, [navigation]);

  const onParty = useCallback(
    (customerId: string) => {
      void Haptics.selectionAsync();
      navigation.navigate('PartyDetail', { customerId });
    },
    [navigation],
  );

  const onLot = useCallback(
    (lotId: string) => {
      void Haptics.selectionAsync();
      navigation.navigate('LotDetail', { lotId });
    },
    [navigation],
  );

  const parties = debounced.length >= 2 ? (q.data?.parties ?? []) : [];
  const lots = debounced.length >= 2 ? (q.data?.lots ?? []) : [];
  const loading = enabled && q.isFetching;
  const err = q.isError ? t('error') : null;
  const showEmpty = enabled && !loading && !q.isError && parties.length === 0 && lots.length === 0;
  const showMinChars = warehouseId.length > 0 && query.trim().length > 0 && query.trim().length < 2;
  const showStartHint = warehouseId.length > 0 && query.trim().length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: gc.bgSurface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, paddingTop: Math.max(insets.top, 8) }}>
        <HStackHeader onBack={goBack} title={t('screen_title')} />

        <Box px="$4" pb="$2">
          <Box borderWidth={1} borderColor="$borderDefault" borderRadius="$lg" bg="$bgSurface" px="$3">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('placeholder')}
              placeholderTextColor={gc.textPlaceholder}
              style={{
                fontSize: 16,
                minHeight: 48,
                paddingVertical: 12,
                color: gc.textPrimary,
              }}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </Box>
        </Box>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          {!warehouseId ? (
            <Text size="sm" color="$textSecondary" py="$3">
              {t('need_warehouse')}
            </Text>
          ) : null}

          {showStartHint ? (
            <Text size="sm" color="$textTertiary" py="$3">
              {t('start_hint')}
            </Text>
          ) : null}

          {showMinChars ? (
            <Text size="sm" color="$textTertiary" py="$3">
              {t('min_chars')}
            </Text>
          ) : null}

          {loading ? (
            <Box py="$6" alignItems="center">
              <ActivityIndicator />
              <Text mt="$2" size="sm" color="$textTertiary">
                {t('loading')}
              </Text>
            </Box>
          ) : null}

          {err ? (
            <Text size="sm" color="$outward" py="$3">
              {err}
            </Text>
          ) : null}

          {showEmpty ? (
            <Text size="sm" color="$textTertiary" py="$3">
              {t('empty')}
            </Text>
          ) : null}

          {parties.length > 0 ? (
            <VStack space="xs" mb="$4">
              <SectionLabel label={t('parties_section')} />
              {parties.map((p) => (
                <Pressable
                  key={p.customerId}
                  onPress={() => onParty(p.customerId)}
                  p="$3"
                  borderRadius="$md"
                  style={{ minHeight: 48, justifyContent: 'center' }}
                >
                  <Text fontWeight="$semibold" color="$textPrimary">
                    {p.customerName}
                  </Text>
                  <Text size="sm" color="$textTertiary">
                    {p.customerCode}
                  </Text>
                </Pressable>
              ))}
            </VStack>
          ) : null}

          {lots.length > 0 ? (
            <VStack space="xs">
              <SectionLabel label={t('lots_section')} />
              {lots.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => onLot(l.id)}
                  p="$3"
                  borderRadius="$md"
                  style={{ minHeight: 48, justifyContent: 'center' }}
                >
                  <Text fontFamily="NotoSerif_600SemiBold" fontWeight="$semibold" color="$textPrimary">
                    {l.lotNumber}
                  </Text>
                  <Text size="sm" color="$textTertiary">
                    {l.customerName} · {l.productName}
                  </Text>
                </Pressable>
              ))}
            </VStack>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function HStackHeader(props: { onBack: () => void; title: string }) {
  const { t } = useTranslation('search');
  return (
    <Box flexDirection="row" alignItems="center" px="$4" pb="$3" gap="$2">
      <Pressable
        onPress={props.onBack}
        accessibilityRole="button"
        accessibilityLabel={t('back_aria')}
        w={44}
        h={44}
        borderRadius="$full"
        justifyContent="center"
        alignItems="center"
      >
        <ArrowLeft size={22} color={gc.textSecondary} strokeWidth={1.75} />
      </Pressable>
      <Text fontFamily="NotoSerif_500Medium" fontSize={24} lineHeight={30} color="$textPrimary" flex={1}>
        {props.title}
      </Text>
    </Box>
  );
}

function SectionLabel(props: { label: string }) {
  return (
    <Text
      px="$1"
      fontSize={11}
      fontFamily="NotoSansMono_500Medium"
      color="$textTertiary"
      textTransform="uppercase"
      letterSpacing={1}
    >
      {props.label}
    </Text>
  );
}
