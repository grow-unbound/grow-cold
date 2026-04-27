import {
  completeStockDelivery,
  CreateLotRequestSchema,
  CreateStockDeliveryRequestSchema,
  insertWarehouseLot,
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

type LodgementForm = z.infer<typeof CreateLotRequestSchema>;
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
  const [picker, setPicker] = useState<'customer' | 'product' | 'lot' | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const customersQ = useQuery({
    queryKey: ['stock-form', 'customers', warehouseId],
    enabled: open && !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('customers')
        .select('id, customer_name, customer_code')
        .eq('warehouse_id', warehouseId)
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const productsQ = useQuery({
    queryKey: ['stock-form', 'products'],
    enabled: open && !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('products')
        .select('id, product_name')
        .eq('is_active', true)
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

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
    enabled: open && !!supabase,
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

  const lForm = useForm<LodgementForm>({
    resolver: zodResolver(CreateLotRequestSchema),
    defaultValues: {
      warehouse_id: warehouseId,
      customer_id: '',
      product_id: '',
      lot_number: '',
      original_bags: 1,
      lodgement_date: today,
      rental_mode: 'MONTHLY',
      location_ids: [],
      driver_name: '',
      vehicle_number: '',
      notes: '',
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
    lForm.setValue('warehouse_id', warehouseId);
    dForm.setValue('warehouse_id', warehouseId);
  }, [warehouseId, lForm, dForm]);

  useEffect(() => {
    if (!open) return;
    if (!canLodgement && mode === 'lodgement') setMode('delivery');
  }, [open, canLodgement, mode]);

  const lotMut = useMutation({
    mutationFn: (body: LodgementForm) => insertWarehouseLot(supabase!, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['stock'] });
      void qc.invalidateQueries({ queryKey: ['stock-form', 'lots', warehouseId] });
      onClose();
      lForm.reset({
        warehouse_id: warehouseId,
        customer_id: '',
        product_id: '',
        lot_number: '',
        original_bags: 1,
        lodgement_date: today,
        rental_mode: 'MONTHLY',
        location_ids: [],
        driver_name: '',
        vehicle_number: '',
        notes: '',
      });
    },
  });

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

  const locIdsL = lForm.watch('location_ids') ?? [];
  const locIdsD = dForm.watch('location_ids') ?? [];

  if (!open) return null;

  const GREEN = '#00B14F';

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <Box flex={1} bg="$backgroundLight0" pt={insets.top}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" px="$4" py="$3" borderBottomWidth={1} borderColor="$borderLight200">
          <Text fontSize={18} fontWeight="$semibold" color="$textLight900">
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
          {mode === 'lodgement' && canLodgement ? (
            <VStack space="md">
              <Field label={t('stock.select_customer')}>
                <Pressable onPress={() => setPicker('customer')}>
                  <Box borderWidth={1} borderColor="$borderLight300" borderRadius={8} p="$3">
                    <Text>
                      {customersQ.data?.find((c) => c.id === lForm.watch('customer_id'))?.customer_name ??
                        '—'}
                    </Text>
                  </Box>
                </Pressable>
              </Field>
              <Field label={t('stock.select_product')}>
                <Pressable onPress={() => setPicker('product')}>
                  <Box borderWidth={1} borderColor="$borderLight300" borderRadius={8} p="$3">
                    <Text>
                      {productsQ.data?.find((p) => p.id === lForm.watch('product_id'))?.product_name ?? '—'}
                    </Text>
                  </Box>
                </Pressable>
              </Field>
              <Field label={`${t('inventory.lot_number')} *`}>
                <Controller
                  control={lForm.control}
                  name="lot_number"
                  render={({ field }) => (
                    <Input>
                      <InputField {...field} placeholder="Lot #" />
                    </Input>
                  )}
                />
              </Field>
              <Field label={t('stock.bags_required')}>
                <Controller
                  control={lForm.control}
                  name="original_bags"
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
              <Field label={`${t('inventory.lodgement')} *`}>
                <Controller
                  control={lForm.control}
                  name="lodgement_date"
                  render={({ field }) => (
                    <Input>
                      <InputField {...field} placeholder="YYYY-MM-DD" />
                    </Input>
                  )}
                />
              </Field>
              <Field label={t('inventory.rental_mode')}>
                <Controller
                  control={lForm.control}
                  name="rental_mode"
                  render={({ field }) => (
                    <Box flexDirection="row" gap="$2">
                      {(['MONTHLY', 'YEARLY', 'BROUGHT_FORWARD'] as const).map((rm) => (
                        <Pressable key={rm} onPress={() => field.onChange(rm)}>
                          <Box
                            px="$3"
                            py="$2"
                            borderRadius={8}
                            borderWidth={1}
                            borderColor={field.value === rm ? GREEN : '$borderLight300'}
                            bg={field.value === rm ? '$primary100' : 'transparent'}
                          >
                            <Text fontSize={12}>{rm}</Text>
                          </Box>
                        </Pressable>
                      ))}
                    </Box>
                  )}
                />
              </Field>
              <LocationToggle
                options={locationsQ.data ?? []}
                value={locIdsL}
                onChange={(ids) => lForm.setValue('location_ids', ids)}
              />
              <Field label={t('inventory.driver_name')}>
                <Controller
                  control={lForm.control}
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
                  control={lForm.control}
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
                  control={lForm.control}
                  name="notes"
                  render={({ field }) => (
                    <Textarea>
                      <TextareaInput {...field} value={field.value ?? ''} />
                    </Textarea>
                  )}
                />
              </Field>
              {lotMut.isError ? (
                <Text color="$red600" size="sm">
                  {t('save_error')}
                </Text>
              ) : null}
              <Button
                onPress={lForm.handleSubmit((v) => lotMut.mutate(v))}
                isDisabled={lotMut.isPending}
                style={{ backgroundColor: GREEN }}
              >
                <ButtonText>{t('stock.save')}</ButtonText>
              </Button>
            </VStack>
          ) : (
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
                <Text size="sm" color="$textLight500">
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
          )}
        </ScrollView>

        <Actionsheet isOpen={picker !== null} onClose={() => setPicker(null)}>
          <ActionsheetBackdrop onPress={() => setPicker(null)} />
          <ActionsheetContent pb="$8" maxHeight="70%">
            <RNScrollView style={{ maxHeight: 360 }}>
              {picker === 'customer'
                ? (customersQ.data ?? []).map((c) => (
                    <ActionsheetItem
                      key={c.id}
                      onPress={() => {
                        lForm.setValue('customer_id', c.id);
                        setPicker(null);
                      }}
                    >
                      <ActionsheetItemText>{c.customer_name}</ActionsheetItemText>
                    </ActionsheetItem>
                  ))
                : null}
              {picker === 'product'
                ? (productsQ.data ?? []).map((p) => (
                    <ActionsheetItem
                      key={p.id}
                      onPress={() => {
                        lForm.setValue('product_id', p.id);
                        setPicker(null);
                      }}
                    >
                      <ActionsheetItemText>{p.product_name}</ActionsheetItemText>
                    </ActionsheetItem>
                  ))
                : null}
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
      </Box>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <VStack space="xs">
      <Text fontSize={14} fontWeight="$semibold" color="$textLight700">
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
      <Text fontSize={14} fontWeight="$semibold" color="$textLight700">
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
                borderColor={on ? '$primary500' : '$borderLight300'}
                bg={on ? '$primary50' : 'transparent'}
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
