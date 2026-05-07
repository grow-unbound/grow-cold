import {
  CreateStockDeliveryRequestSchema,
  completeStockDelivery,
  type CreateStockDeliveryInput,
} from '@growcold/shared';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  Box,
  Button,
  ButtonText,
  Input,
  InputField,
  ScrollView,
  Text,
  Textarea,
  TextareaInput,
  VStack,
} from '@gluestack-ui/themed';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView as RNScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { z } from 'zod';
import { supabase } from '../../../lib/supabase';
import { useSessionStore } from '../../../stores/session-store';
import { LodgementRecordWizard } from './LodgementRecordWizard';

type DeliveryForm = z.infer<typeof CreateStockDeliveryRequestSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
}

export function RecordTransactionSheet({ open, onClose, warehouseId }: Props) {
  const { t } = useTranslation('pages');
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const role = useSessionStore((s) => s.role);
  const canLodgement = role !== 'STAFF';
  const [mode, setMode] = useState<'lodgement' | 'delivery'>('delivery');
  const [picker, setPicker] = useState<'lot' | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const lotsQ = useQuery({
    queryKey: ['stock-form', 'lots', warehouseId],
    enabled: open && !!supabase && mode === 'delivery',
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('lots')
        .select('id, lot_number, balance_bags, customer_id')
        .eq('warehouse_id', warehouseId)
        .gt('balance_bags', 0)
        .in('status', ['ACTIVE', 'STALE']);
      if (error) throw error;
      const rows = data ?? [];
      const custIds = [...new Set(rows.map((r) => r.customer_id))];
      const { data: custs } =
        custIds.length > 0
          ? await supabase!.from('customers').select('id, customer_name').in('id', custIds)
          : { data: [] as { id: string; customer_name: string }[] };
      const cmap = new Map((custs ?? []).map((c) => [c.id, c.customer_name]));
      return rows.map((r) => ({
        id: r.id,
        lot_number: r.lot_number,
        balance_bags: r.balance_bags,
        customer_name: cmap.get(r.customer_id) ?? '',
      }));
    },
  });

  const locationsQ = useQuery({
    queryKey: ['stock-form', 'locations', warehouseId],
    enabled: open && !!supabase && mode === 'delivery',
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('locations')
        .select('id, name')
        .eq('warehouse_id', warehouseId)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const dForm = useForm<DeliveryForm>({
    resolver: zodResolver(CreateStockDeliveryRequestSchema),
    defaultValues: {
      warehouse_id: warehouseId,
      lot_id: '',
      num_bags_out: 1,
      delivery_date: today,
      notes: '',
      driver_name: '',
      vehicle_number: '',
      location_ids: [],
    },
  });

  useEffect(() => {
    dForm.setValue('warehouse_id', warehouseId);
  }, [warehouseId, dForm]);

  useEffect(() => {
    if (!open) return;
    if (!canLodgement && mode === 'lodgement') setMode('delivery');
  }, [open, canLodgement, mode]);

  const delMut = useMutation({
    mutationFn: (body: CreateStockDeliveryInput) => completeStockDelivery(supabase!, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['stock'] });
      void qc.invalidateQueries({ queryKey: ['stock-form', 'lots', warehouseId] });
      onClose();
      dForm.reset({
        warehouse_id: warehouseId,
        lot_id: '',
        num_bags_out: 1,
        delivery_date: today,
        notes: '',
        driver_name: '',
        vehicle_number: '',
        location_ids: [],
      });
    },
  });

  const selectedLot = (lotsQ.data ?? []).find((x) => x.id === dForm.watch('lot_id'));
  const maxOut = selectedLot?.balance_bags ?? 0;

  const locIdsD = dForm.watch('location_ids') ?? [];

  if (!open) return null;

  const GREEN = '#C8712A';

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <Box flex={1} bg="$bgSurface" pt={insets.top}>
        {mode === 'lodgement' && canLodgement ? (
          <VStack flex={1}>
            <Box flexDirection="row" gap="$2" px="$4" py="$2" borderBottomWidth={1} borderColor="$borderLight200">
              <Button
                flex={1}
                variant="solid"
                onPress={() => setMode('lodgement')}
                style={{ backgroundColor: GREEN }}
              >
                <ButtonText color="$white">{t('stock.lodgement')}</ButtonText>
              </Button>
              <Button
                flex={1}
                variant="outline"
                onPress={() => setMode('delivery')}
                style={{ borderColor: GREEN }}
              >
                <ButtonText color={GREEN}>{t('stock.delivery')}</ButtonText>
              </Button>
            </Box>
            <Box flex={1}>
              <LodgementRecordWizard warehouseId={warehouseId} onClose={onClose} accentColor={GREEN} />
            </Box>
          </VStack>
        ) : (
          <>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" px="$4" py="$3" borderBottomWidth={1} borderColor="$borderLight200">
              <Text fontSize={18} fontWeight="$semibold" color="$textPrimary">
                {t('stock.record_title')}
              </Text>
              <Pressable onPress={onClose}>
                <Text fontSize={16} color={GREEN} fontWeight="$semibold">
                  {t('stock.cancel')}
                </Text>
              </Pressable>
            </Box>

            {canLodgement ? (
              <Box flexDirection="row" gap="$2" px="$4" py="$2">
                <Button
                  flex={1}
                  variant={mode === 'lodgement' ? 'solid' : 'outline'}
                  onPress={() => setMode('lodgement')}
                  style={mode === 'lodgement' ? { backgroundColor: GREEN } : { borderColor: GREEN }}
                >
                  <ButtonText color={mode === 'lodgement' ? '$white' : GREEN}>{t('stock.lodgement')}</ButtonText>
                </Button>
                <Button
                  flex={1}
                  variant={mode === 'delivery' ? 'solid' : 'outline'}
                  onPress={() => setMode('delivery')}
                  style={mode === 'delivery' ? { backgroundColor: GREEN } : { borderColor: GREEN }}
                >
                  <ButtonText color={mode === 'delivery' ? '$white' : GREEN}>{t('stock.delivery')}</ButtonText>
                </Button>
              </Box>
            ) : null}

            <ScrollView flex={1} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <VStack space="md">
                <Field label={t('stock.select_lot')}>
                  <Pressable onPress={() => setPicker('lot')}>
                    <Box borderWidth={1} borderColor="$borderLight300" borderRadius={8} p="$3">
                      <Text>
                        {selectedLot
                          ? `${selectedLot.lot_number} · ${selectedLot.balance_bags} bags`
                          : '—'}
                      </Text>
                    </Box>
                  </Pressable>
                </Field>
                <Field label={t('stock.bags_required')}>
                  <Controller
                    control={dForm.control}
                    name="num_bags_out"
                    render={({ field }) => (
                      <Input>
                        <InputField
                          {...field}
                          value={String(field.value)}
                          onChangeText={(v) => field.onChange(Number(v) || 0)}
                          keyboardType="number-pad"
                        />
                      </Input>
                    )}
                  />
                </Field>
                {selectedLot ? (
                  <Text size="sm" color="$textTertiary">
                    Max {maxOut}
                  </Text>
                ) : null}
                <Field label={`${t('transactions.date')} *`}>
                  <Controller
                    control={dForm.control}
                    name="delivery_date"
                    render={({ field }) => (
                      <Input>
                        <InputField {...field} placeholder="YYYY-MM-DD" />
                      </Input>
                    )}
                  />
                </Field>
                <LocationToggle
                  options={locationsQ.data ?? []}
                  value={locIdsD}
                  onChange={(ids) => dForm.setValue('location_ids', ids)}
                />
                <Field label={t('inventory.driver_name')}>
                  <Controller
                    control={dForm.control}
                    name="driver_name"
                    render={({ field }) => (
                      <Input>
                        <InputField {...field} value={field.value ?? ''} />
                      </Input>
                    )}
                  />
                </Field>
                <Field label={t('inventory.vehicle_number')}>
                  <Controller
                    control={dForm.control}
                    name="vehicle_number"
                    render={({ field }) => (
                      <Input>
                        <InputField {...field} value={field.value ?? ''} />
                      </Input>
                    )}
                  />
                </Field>
                <Field label={t('stock.notes')}>
                  <Controller
                    control={dForm.control}
                    name="notes"
                    render={({ field }) => (
                      <Textarea>
                        <TextareaInput {...field} value={field.value ?? ''} />
                      </Textarea>
                    )}
                  />
                </Field>
                {delMut.isError ? (
                  <Text color="$red600" size="sm">
                    {t('save_error')}
                  </Text>
                ) : null}
                <Button
                  onPress={dForm.handleSubmit((v) => delMut.mutate(v))}
                  isDisabled={delMut.isPending}
                  style={{ backgroundColor: GREEN }}
                >
                  <ButtonText>{t('stock.save')}</ButtonText>
                </Button>
              </VStack>
            </ScrollView>

            <Actionsheet isOpen={picker !== null} onClose={() => setPicker(null)}>
              <ActionsheetBackdrop onPress={() => setPicker(null)} />
              <ActionsheetContent pb="$8" maxHeight="70%">
                <RNScrollView style={{ maxHeight: 360 }}>
                  {picker === 'lot'
                    ? (lotsQ.data ?? []).map((l) => (
                        <ActionsheetItem
                          key={l.id}
                          onPress={() => {
                            dForm.setValue('lot_id', l.id);
                            setPicker(null);
                          }}
                        >
                          <ActionsheetItemText>
                            {l.lot_number} · {l.balance_bags} · {l.customer_name}
                          </ActionsheetItemText>
                        </ActionsheetItem>
                      ))
                    : null}
                </RNScrollView>
              </ActionsheetContent>
            </Actionsheet>
          </>
        )}
      </Box>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <VStack space="xs">
      <Text fontSize={14} fontWeight="$semibold" color="$textSecondary">
        {label}
      </Text>
      {children}
    </VStack>
  );
}

function LocationToggle(props: {
  options: { id: string; name: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useTranslation('pages');
  return (
    <VStack space="xs">
      <Text fontSize={14} fontWeight="$semibold" color="$textSecondary">
        {t('inventory.locations')}
      </Text>
      <Box flexDirection="row" flexWrap="wrap" gap="$2">
        {props.options.map((loc) => {
          const on = props.value.includes(loc.id);
          return (
            <Pressable
              key={loc.id}
              onPress={() => {
                if (on) props.onChange(props.value.filter((id) => id !== loc.id));
                else props.onChange([...props.value, loc.id]);
              }}
            >
              <Box
                px="$3"
                py="$1"
                borderRadius="$full"
                borderWidth={1}
                borderColor={on ? '$brandUi' : '$borderLight300'}
                bg={on ? '$brandSubtle' : 'transparent'}
              >
                <Text fontSize={12}>{loc.name}</Text>
              </Box>
            </Pressable>
          );
        })}
      </Box>
    </VStack>
  );
}
