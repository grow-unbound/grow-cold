import {
  CreateLotRequestSchema,
  insertWarehouseLot,
  suggestNextLotNumber,
} from '@growcold/shared';
import {
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { z } from 'zod';
import { saveLodgementChargesMobile, type LodgementSaveChargeRow } from '../../../lib/save-lodgement-charges';
import { supabase } from '../../../lib/supabase';

type LodgementForm = z.infer<typeof CreateLotRequestSchema>;
type Step = 1 | 2 | 3;

interface ChargeRowPreview {
  product_charge_type_id: string;
  charge_type_code: string;
  display_name: string;
  rate_per_bag: number | null;
  default_bags: number | null;
  is_transport: boolean;
  has_labor: boolean;
}

function chargeCodeNorm(code: string): string {
  return code.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function chargeCodeIsTransport(codeRaw: string): boolean {
  return chargeCodeNorm(codeRaw) === 'TRANSPORT';
}

function defaultBagsForChargeCode(codeRaw: string, originalBags: number): number | null {
  const code = chargeCodeNorm(codeRaw);
  if (code === 'TRANSPORT') return null;
  if (code === 'HAMALI' || code === 'MAMULLE') return originalBags;
  return 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

interface ChargeDraftRow {
  bags: number;
  recv: number;
  recvManual: boolean;
  paid: number;
  method: 'CASH' | 'UPI' | 'OTHER' | '';
}

interface Props {
  warehouseId: string;
  onClose: () => void;
  /** Brand accent */
  accentColor: string;
}

export function LodgementRecordWizard({ warehouseId, onClose, accentColor }: Props) {
  const { t } = useTranslation('pages');
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [step, setStep] = useState<Step>(1);
  const [partyQ, setPartyQ] = useState('');
  const [productQ, setProductQ] = useState('');
  const [locOpen, setLocOpen] = useState(false);
  const [locQ, setLocQ] = useState('');
  const [transportOpen, setTransportOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);
  const [chargeDraft, setChargeDraft] = useState<Record<string, ChargeDraftRow>>({});
  const [lotNumberManual, setLotNumberManual] = useState(false);

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

  const customerId = lForm.watch('customer_id');
  const productId = lForm.watch('product_id');
  const bags = lForm.watch('original_bags');
  const locIds = lForm.watch('location_ids') ?? [];
  const lotNo = lForm.watch('lot_number');

  useEffect(() => {
    lForm.setValue('warehouse_id', warehouseId);
  }, [warehouseId, lForm]);

  const customersQ = useQuery({
    queryKey: ['lodgement-wizard', 'customers', warehouseId],
    enabled: !!supabase,
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
    queryKey: ['lodgement-wizard', 'products'],
    enabled: !!supabase,
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

  const locationsQ = useQuery({
    queryKey: ['lodgement-wizard', 'locations', warehouseId],
    enabled: !!supabase,
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

  const lotNumbersQ = useQuery({
    queryKey: ['lodgement-wizard', 'lot-numbers', warehouseId],
    enabled: !!supabase && step === 3,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('lots')
        .select('lot_number')
        .eq('warehouse_id', warehouseId)
        .limit(10_000);
      if (error) throw error;
      return (data ?? []).map((r) => r.lot_number);
    },
  });

  const chargePreviewQ = useQuery({
    queryKey: ['lodgement-wizard', 'charges-preview', warehouseId, productId, bags],
    enabled: !!supabase && step === 3 && Boolean(productId) && bags > 0,
    queryFn: async (): Promise<ChargeRowPreview[]> => {
      const { data: wh, error: wErr } = await supabase!
        .from('warehouses')
        .select('tenant_id')
        .eq('id', warehouseId)
        .single();
      if (wErr || !wh) throw wErr ?? new Error('wh');
      const { data: pcs, error: pcErr } = await supabase!
        .from('product_charges')
        .select(
          `
          product_charge_type_id,
          charges_per_bag,
          charge_types!inner(id, tenant_id, code, display_name, is_active)
        `,
        )
        .eq('product_id', productId!);
      if (pcErr) throw pcErr;
      const out: ChargeRowPreview[] = [];
      for (const row of pcs ?? []) {
        const ct = row.charge_types as unknown as {
          tenant_id: string;
          code: string;
          display_name: string;
          is_active: boolean;
        };
        if (!ct?.is_active || ct.tenant_id !== wh.tenant_id) continue;
        if (ct.code.trim().toUpperCase() === 'RENT') continue;
        const is_transport = chargeCodeIsTransport(ct.code);
        const defBags = defaultBagsForChargeCode(ct.code, bags);
        const cpbRaw =
          typeof row.charges_per_bag === 'number' ? row.charges_per_bag : Number(row.charges_per_bag);
        const rate_per_bag =
          is_transport ? null
          : Number.isFinite(cpbRaw) && !Number.isNaN(cpbRaw) ? Math.round(Number(cpbRaw) * 10000) / 10000
          : null;
        out.push({
          product_charge_type_id: row.product_charge_type_id,
          charge_type_code: ct.code,
          display_name: ct.display_name,
          rate_per_bag,
          default_bags: defBags,
          is_transport,
          has_labor: !is_transport,
        });
      }
      out.sort((a, b) => a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' }));
      return out;
    },
  });

  useEffect(() => {
    const rows = chargePreviewQ.data;
    if (!rows) return;
    const next: Record<string, ChargeDraftRow> = {};
    for (const row of rows) {
      let b = row.is_transport ? 0 : row.default_bags ?? 0;
      b = Math.max(0, Math.floor(b));
      const rate = row.rate_per_bag ?? 0;
      const recv = row.is_transport ? 0 : round2(b * rate);
      next[row.product_charge_type_id] = { bags: b, recv, recvManual: false, paid: 0, method: '' };
    }
    setChargeDraft(next);
  }, [chargePreviewQ.data]);

  useEffect(() => {
    if (lotNumberManual) return;
    const nums = lotNumbersQ.data;
    if (nums == null) return;
    const b = typeof bags === 'number' && bags > 0 ? bags : 1;
    lForm.setValue('lot_number', suggestNextLotNumber(nums, b), { shouldValidate: false });
  }, [lotNumbersQ.data, bags, lotNumberManual, lForm]);

  const dupCheckQ = useQuery({
    queryKey: ['lodgement-wizard', 'dup-lot', warehouseId, lotNo],
    enabled: !!supabase && step === 3 && lotNo.trim().length > 0,
    queryFn: async () => {
      const { data } = await supabase!
        .from('lots')
        .select('id')
        .eq('warehouse_id', warehouseId)
        .eq('lot_number', lotNo.trim())
        .maybeSingle();
      return !data;
    },
  });

  const customers = customersQ.data ?? [];
  const products = productsQ.data ?? [];
  const locations = locationsQ.data ?? [];

  const filteredParties = useMemo(() => {
    const q = partyQ.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.customer_code.toLowerCase().includes(q) || c.customer_name.toLowerCase().includes(q),
    );
  }, [customers, partyQ]);

  const filteredProducts = useMemo(() => {
    const q = productQ.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.product_name.toLowerCase().includes(q));
  }, [products, productQ]);

  const filteredLocs = useMemo(() => {
    const q = locQ.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [locations, locQ]);

  const selectedParty = customers.find((c) => c.id === customerId);
  const selectedProduct = products.find((p) => p.id === productId);

  function patchCharge(pctId: string, patch: Partial<ChargeDraftRow>) {
    setChargeDraft((prev) => ({
      ...prev,
      [pctId]: { ...(prev[pctId] ?? { bags: 0, recv: 0, recvManual: false, paid: 0, method: '' }), ...patch },
    }));
  }

  function chargesHaveEntries(rows: ChargeRowPreview[], draft: Record<string, ChargeDraftRow>): boolean {
    for (const row of rows) {
      const d = draft[row.product_charge_type_id];
      if (!d) continue;
      if (d.recv > 0) return true;
      if (row.has_labor && d.paid > 0) return true;
    }
    return false;
  }

  const lotMut = useMutation({
    mutationFn: async (body: LodgementForm) => {
      const rows = chargePreviewQ.data ?? [];
      const lotId = await insertWarehouseLot(supabase!, body);
      if (rows.length > 0 && chargesHaveEntries(rows, chargeDraft)) {
        const { data: lot, error: lErr } = await supabase!.from('lots').select('*').eq('id', lotId).single();
        if (lErr || !lot) throw lErr ?? new Error('Lot fetch failed');
        const { data: u } = await supabase!.auth.getUser();
        const uid = u.user?.id;
        if (!uid) throw new Error('Not signed in');
        const chargeDate =
          lot.lodgement_date.includes('T') ? lot.lodgement_date.slice(0, 10) : String(lot.lodgement_date).slice(0, 10);
        const saveRows: LodgementSaveChargeRow[] = rows.map((r) => {
          const d = chargeDraft[r.product_charge_type_id]!;
          return {
            product_charge_type_id: r.product_charge_type_id,
            charge_type_code: r.charge_type_code,
            bags: r.is_transport ? null : d.bags,
            receivable_amount: d.recv,
            receivable_manual: d.recvManual,
            labor_paid: r.has_labor ? d.paid : 0,
            labor_payment_method:
              r.has_labor && d.paid > 0 ? d.method === '' ? 'CASH' : d.method : null,
            is_transport: r.is_transport,
          };
        });
        const res = await saveLodgementChargesMobile({
          supabase: supabase!,
          userId: uid,
          lot,
          chargeDateYYYYMMDD: chargeDate,
          laborPaymentDateYYYYMMDD: chargeDate,
          rows: saveRows,
        });
        if ('error' in res) throw new Error(res.error);
      }
      return lotId;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['stock'] });
      void qc.invalidateQueries({ queryKey: ['stock-form', 'lots', warehouseId] });
      onClose();
      setStep(1);
      setChargeDraft({});
      setLotNumberManual(false);
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

  const requestClose = useCallback(() => {
    if (lForm.formState.isDirty) {
      Alert.alert(t('inventory.discard_unsaved_title'), t('inventory.discard_unsaved_body'), [
        { text: t('inventory.keep_editing'), style: 'cancel' },
        {
          text: t('inventory.discard_confirm'),
          style: 'destructive',
          onPress: onClose,
        },
      ]);
      return;
    }
    onClose();
  }, [lForm.formState.isDirty, onClose, t]);

  const backHeader = () => {
    if (step === 2) {
      setStep(1);
      setProductQ('');
      return;
    }
    if (step === 3) {
      setStep(2);
      return;
    }
    requestClose();
  };

  const zoneOk =
    Boolean(customerId) &&
    Boolean(productId) &&
    bags > 0 &&
    lotNo.trim().length > 0 &&
    locIds.length > 0 &&
    dupCheckQ.data !== false;

  const chargeRows = chargePreviewQ.data ?? [];

  return (
    <VStack flex={1}>
      <Box flexDirection="row" alignItems="center" px="$3" py="$2" borderBottomWidth={1} borderColor="$borderLight200">
        <Pressable
          onPress={backHeader}
          accessibilityRole="button"
          accessibilityLabel={t('inventory.back_a11y')}
        >
          <Text fontSize={20} fontWeight="$bold" color="$textPrimary">
            ←
          </Text>
        </Pressable>
        <Text flex={1} textAlign="center" fontSize={16} fontWeight="$bold" color="$textPrimary" mr="$6">
          {t('inventory.new_lot_title')}
        </Text>
      </Box>

      {step === 1 ? (
        <ScrollView flex={1} px="$4" py="$3">
          <Text fontSize={18} fontWeight="$semibold" mb="$2" color="$textPrimary">
            {t('inventory.step_which_party')}
          </Text>
          <TextInput
            placeholder={t('inventory.search_party')}
            value={partyQ}
            onChangeText={setPartyQ}
            style={{
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              fontSize: 16,
            }}
          />
          <VStack space="sm">
            {filteredParties.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  lForm.setValue('customer_id', c.id, { shouldDirty: true, shouldValidate: true });
                  setPartyQ('');
                  setStep(2);
                }}
              >
                <Box borderWidth={1} borderColor="$borderLight200" borderRadius={8} p="$3">
                  <Text fontWeight="$semibold">{c.customer_name}</Text>
                  <Text size="sm" color="$textTertiary">
                    {c.customer_code}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </VStack>
        </ScrollView>
      ) : null}

      {step === 2 ? (
        <ScrollView flex={1} px="$4" py="$3">
          {selectedParty ? (
            <Box mb="$2" bg="$brandSubtle" p="$2" borderRadius={8}>
              <Text fontWeight="$semibold" color={accentColor}>
                {selectedParty.customer_name} · {selectedParty.customer_code}
              </Text>
            </Box>
          ) : null}
          <Text fontSize={18} fontWeight="$semibold" mb="$2" color="$textPrimary">
            {t('inventory.step_which_product')}
          </Text>
          <TextInput
            placeholder={t('inventory.search_product')}
            value={productQ}
            onChangeText={setProductQ}
            style={{
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              fontSize: 16,
            }}
          />
          <VStack space="sm">
            {filteredProducts.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  lForm.setValue('product_id', p.id, { shouldDirty: true, shouldValidate: true });
                  setProductQ('');
                  setLotNumberManual(false);
                  setStep(3);
                }}
              >
                <Box borderWidth={1} borderColor="$borderLight200" borderRadius={8} p="$3">
                  <Text fontWeight="$semibold">{p.product_name}</Text>
                </Box>
              </Pressable>
            ))}
          </VStack>
        </ScrollView>
      ) : null}

      {step === 3 ? (
        <>
          <ScrollView flex={1} px="$4" py="$3" contentContainerStyle={{ paddingBottom: 100 }}>
            <VStack space="md">
              <Box bg="$backgroundLight100" p="$2" borderRadius={8}>
                {selectedParty ? (
                  <Text fontWeight="$semibold">
                    {selectedParty.customer_name} · {selectedParty.customer_code}
                  </Text>
                ) : null}
                {selectedProduct ? <Text color="$textSecondary">{selectedProduct.product_name}</Text> : null}
              </Box>

              <VStack space="xs">
                <Text fontSize={14} fontWeight="$semibold" color="$textSecondary">
                  {`${t('inventory.bags')} *`}
                </Text>
                <Controller
                  control={lForm.control}
                  name="original_bags"
                  render={({ field }) => (
                    <Input>
                      <InputField
                        {...field}
                        value={String(field.value)}
                        onChangeText={(v) => {
                          field.onChange(Number(v) || 0);
                          setLotNumberManual(false);
                        }}
                        keyboardType="number-pad"
                      />
                    </Input>
                  )}
                />
              </VStack>

              <VStack space="xs">
                <Text fontSize={14} fontWeight="$semibold" color="$textSecondary">
                  {`${t('inventory.lot_number')} *`}
                </Text>
                <Controller
                  control={lForm.control}
                  name="lot_number"
                  render={({ field }) => (
                    <Input>
                      <InputField
                        {...field}
                        onChangeText={(v) => {
                          setLotNumberManual(true);
                          field.onChange(v);
                        }}
                      />
                    </Input>
                  )}
                />
                {dupCheckQ.data === false ? (
                  <Text color="$red600" size="sm">
                    {t('inventory.lot_number_taken')}
                  </Text>
                ) : null}
              </VStack>

              <VStack space="xs">
                <Text fontSize={14} fontWeight="$semibold" color="$textSecondary">
                  {`${t('inventory.locations')} *`}
                </Text>
                <Pressable onPress={() => setLocOpen(true)}>
                  <Box
                    minHeight={48}
                    borderWidth={1}
                    borderColor="$borderLight300"
                    borderRadius={8}
                    p="$2"
                    flexDirection="row"
                    flexWrap="wrap"
                    gap="$1"
                  >
                    {locIds.length === 0 ? (
                      <Text color="$textTertiary">{t('inventory.pick_locations')}</Text>
                    ) : (
                      locIds.map((id) => {
                        const name = locations.find((l) => l.id === id)?.name ?? id;
                        return (
                          <Box
                            key={id}
                            flexDirection="row"
                            alignItems="center"
                            bg="$brandSubtle"
                            px="$2"
                            py="$1"
                            borderRadius="$full"
                          >
                            <Text size="xs">{name}</Text>
                            <Pressable
                              onPress={(e) => {
                                e?.stopPropagation?.();
                                lForm.setValue(
                                  'location_ids',
                                  locIds.filter((x) => x !== id),
                                  { shouldDirty: true, shouldValidate: true },
                                );
                              }}
                            >
                              <Text ml="$1" size="xs">
                                ×
                              </Text>
                            </Pressable>
                          </Box>
                        );
                      })
                    )}
                  </Box>
                </Pressable>
              </VStack>

              <VStack space="xs">
                <Text fontSize={14} fontWeight="$semibold" color="$textSecondary">
                  {t('inventory.notes')}
                </Text>
                <Controller
                  control={lForm.control}
                  name="notes"
                  render={({ field }) => (
                    <Textarea>
                      <TextareaInput {...field} value={field.value ?? ''} />
                    </Textarea>
                  )}
                />
              </VStack>

              <Pressable onPress={() => setTransportOpen((o) => !o)}>
                <Box flexDirection="row" justifyContent="space-between" py="$2">
                  <Text fontSize={14} fontWeight="$semibold" color="$textSecondary">
                    {t('inventory.transport_details_optional')}
                  </Text>
                  <Text>{transportOpen ? '⌃' : '⌄'}</Text>
                </Box>
              </Pressable>
              {transportOpen ? (
                <VStack space="sm">
                  <Controller
                    control={lForm.control}
                    name="driver_name"
                    render={({ field }) => (
                      <Input>
                        <InputField {...field} value={field.value ?? ''} placeholder={t('inventory.driver_name')} />
                      </Input>
                    )}
                  />
                  <Controller
                    control={lForm.control}
                    name="vehicle_number"
                    render={({ field }) => (
                      <Input>
                        <InputField {...field} value={field.value ?? ''} placeholder={t('inventory.vehicle_number')} />
                      </Input>
                    )}
                  />
                </VStack>
              ) : null}

              {chargeRows.length > 0 ? (
                <>
                  <Pressable onPress={() => setChargesOpen((o) => !o)}>
                    <Box flexDirection="row" justifyContent="space-between" py="$2">
                      <Text fontSize={14} fontWeight="$semibold" color="$textSecondary">
                        {t('inventory.add_charges_optional')}
                      </Text>
                      <Text>{chargesOpen ? '⌃' : '⌄'}</Text>
                    </Box>
                  </Pressable>
                  {chargesOpen ?
                    <VStack space="md">
                      {chargeRows.map((row) => {
                        const dr = chargeDraft[row.product_charge_type_id];
                        if (!dr) return null;
                        const rateLabel = row.rate_per_bag != null ? ` (₹${row.rate_per_bag}/bag)` : '';
                        return (
                          <Box key={row.product_charge_type_id} borderWidth={1} borderColor="$borderLight200" p="$2" borderRadius={8}>
                            <Text fontWeight="$bold">
                              {row.display_name}
                              {rateLabel}
                            </Text>
                            {row.is_transport ?
                              <Input mt="$2">
                                <InputField
                                  value={String(dr.recv)}
                                  onChangeText={(v) => {
                                    const n = Number(v);
                                    patchCharge(row.product_charge_type_id, {
                                      recv: Number.isFinite(n) ? round2(Math.max(0, n)) : 0,
                                      recvManual: true,
                                    });
                                  }}
                                  keyboardType="decimal-pad"
                                />
                              </Input>
                            : <>
                                <Input mt="$2">
                                  <InputField
                                    value={String(dr.bags)}
                                    onChangeText={(v) => {
                                      const b = Math.max(0, Math.floor(Number(v)));
                                      const rate = row.rate_per_bag ?? 0;
                                      patchCharge(row.product_charge_type_id, {
                                        bags: b,
                                        recv: round2(b * rate),
                                        recvManual: false,
                                      });
                                    }}
                                    keyboardType="number-pad"
                                  />
                                </Input>
                                <Text size="sm" mt="$1" color="$textSecondary">
                                  {t('inventory.charges_receivable')}: ₹{dr.recv.toFixed(2)}
                                </Text>
                              </>
                            }
                            {row.has_labor ?
                              <VStack mt="$2" space="xs">
                                <Text size="sm" fontWeight="$semibold">
                                  {t('inventory.charges_paid_field')}
                                </Text>
                                <Input>
                                  <InputField
                                    value={String(dr.paid)}
                                    onChangeText={(v) => {
                                      const n = Number(v);
                                      patchCharge(row.product_charge_type_id, {
                                        paid: Number.isFinite(n) ? round2(Math.max(0, n)) : 0,
                                      });
                                    }}
                                    keyboardType="decimal-pad"
                                  />
                                </Input>
                              </VStack>
                            : null}
                          </Box>
                        );
                      })}
                      <Text fontWeight="$bold">
                        {t('inventory.total_receivable')}: ₹
                        {round2(chargeRows.reduce((s, r) => s + (chargeDraft[r.product_charge_type_id]?.recv ?? 0), 0)).toFixed(2)}
                      </Text>
                    </VStack>
                  : null}
                </>
              ) : null}

              {lotMut.isError ? (
                <Text color="$red600" size="sm">
                  {t('save_error')}
                </Text>
              ) : null}
            </VStack>
          </ScrollView>

          <Box
            borderTopWidth={1}
            borderColor="$borderLight200"
            px="$4"
            pt="$3"
            pb={insets.bottom + 12}
            flexDirection="row"
            justifyContent="space-between"
            bg="$white"
          >
            <Button variant="outline" onPress={requestClose} style={{ borderColor: accentColor, flex: 1, marginRight: 8 }}>
              <ButtonText color={accentColor}>{t('inventory.cancel')}</ButtonText>
            </Button>
            <Button
              onPress={lForm.handleSubmit((v) => lotMut.mutate(v))}
              isDisabled={!zoneOk || lotMut.isPending}
              style={{ backgroundColor: accentColor, flex: 1 }}
            >
              <ButtonText color="$white">{t('inventory.submit')}</ButtonText>
            </Button>
          </Box>
        </>
      ) : null}

      <Modal visible={locOpen} animationType="slide" onRequestClose={() => setLocOpen(false)}>
        <Box flex={1} bg="$white" pt="$12" px="$4">
          <Text fontWeight="$bold" mb="$2" fontSize={18}>
            {t('inventory.locations')}
          </Text>
          <TextInput
            placeholder={t('inventory.search_locations')}
            value={locQ}
            onChangeText={setLocQ}
            style={{
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              fontSize: 16,
            }}
          />
          <ScrollView flex={1}>
            <VStack space="xs">
              {filteredLocs.map((l) => {
                const on = locIds.includes(l.id);
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => {
                      const set = new Set(locIds);
                      if (on) set.delete(l.id);
                      else set.add(l.id);
                      lForm.setValue('location_ids', [...set], { shouldDirty: true, shouldValidate: true });
                    }}
                  >
                    <Box p="$3" bg={on ? '$brandSubtle' : 'transparent'} borderRadius={8}>
                      <Text>
                        {l.name} {on ? '✓' : ''}
                      </Text>
                    </Box>
                  </Pressable>
                );
              })}
            </VStack>
          </ScrollView>
          <Button mb="$4" onPress={() => setLocOpen(false)} style={{ backgroundColor: accentColor }}>
            <ButtonText color="$white">{t('inventory.confirm')}</ButtonText>
          </Button>
        </Box>
      </Modal>
    </VStack>
  );
}
