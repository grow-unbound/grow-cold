import {
  CreateReceiptRequestSchema,
  CreateWarehouseCashPaymentRequestSchema,
  PAYMENT_METHOD,
  insertCustomerMoneyReceipt,
  insertWarehouseCashPayment,
} from '@growcold/shared';
import {
  Box,
  Button,
  ButtonText,
  Input,
  InputField,
  Pressable,
  ScrollView,
  Text,
  Textarea,
  TextareaInput,
  VStack,
} from '@gluestack-ui/themed';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView as RNScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

const GREEN = '#16A34A';
const PURPLE = '#7C3AED';

interface Props {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
}

type Mode = 'receipt' | 'payment';

export function RecordTransactionSheet({ open, onClose, warehouseId }: Props) {
  const { t } = useTranslation('pages');
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>('receipt');
  const today = new Date().toISOString().slice(0, 10);

  const [rCustomer, setRCustomer] = useState('');
  const [rDate, setRDate] = useState(today);
  const [rAmount, setRAmount] = useState('');
  const [rMethod, setRMethod] = useState<(typeof PAYMENT_METHOD)[number]>('CASH');
  const [rNotes, setRNotes] = useState('');

  const [pRecipient, setPRecipient] = useState('');
  const [pDate, setPDate] = useState(today);
  const [pAmount, setPAmount] = useState('');
  const [pMethod, setPMethod] = useState<(typeof PAYMENT_METHOD)[number]>('CASH');
  const [pNotes, setPNotes] = useState('');

  const customersQ = useQuery({
    queryKey: ['money-form', 'customers', warehouseId],
    enabled: open && !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase!
        .from('customers')
        .select('id, customer_name')
        .eq('warehouse_id', warehouseId)
        .limit(400);
      if (error) throw error;
      return data ?? [];
    },
  });

  const receiptMut = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('no supabase');
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error('not signed in');
      const body = CreateReceiptRequestSchema.parse({
        warehouse_id: warehouseId,
        customer_id: rCustomer,
        receipt_date: rDate,
        total_amount: rAmount,
        payment_method: rMethod,
        notes: rNotes || undefined,
      });
      await insertCustomerMoneyReceipt(supabase, body, u.user.id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['money', warehouseId] });
      onClose();
      setRAmount('');
      setRNotes('');
    },
  });

  const paymentMut = useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('no supabase');
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error('not signed in');
      const body = CreateWarehouseCashPaymentRequestSchema.parse({
        warehouse_id: warehouseId,
        payment_date: pDate,
        total_amount: pAmount,
        payment_method: pMethod,
        recipient_name: pRecipient,
        notes: pNotes || undefined,
      });
      await insertWarehouseCashPayment(supabase, body, u.user.id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['money', warehouseId] });
      onClose();
      setPAmount('');
      setPRecipient('');
      setPNotes('');
    },
  });

  if (!open) return null;

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Box flex={1} justifyContent="flex-end" bg="rgba(0,0,0,0.4)">
        <Box bg="$backgroundLight0" borderTopLeftRadius={20} borderTopRightRadius={20} pb={insets.bottom + 16} maxHeight="92%">
          <VStack p="$4" space="md">
            <Text fontSize={18} fontWeight="$bold">
              {t('money.record_title')}
            </Text>
            <Box flexDirection="row" gap="$2">
              <Pressable
                onPress={() => setMode('receipt')}
                flex={1}
                p="$2"
                borderRadius={10}
                style={{ backgroundColor: mode === 'receipt' ? GREEN : '#D1D5DB' }}
              >
                <Text textAlign="center" color={mode === 'receipt' ? '$white' : '$textLight700'} fontWeight="$semibold">
                  {t('money.mode_receipt')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('payment')}
                flex={1}
                p="$2"
                borderRadius={10}
                style={{ backgroundColor: mode === 'payment' ? PURPLE : '#D1D5DB' }}
              >
                <Text textAlign="center" color={mode === 'payment' ? '$white' : '$textLight700'} fontWeight="$semibold">
                  {t('money.mode_payment')}
                </Text>
              </Pressable>
            </Box>

            <ScrollView>
              {mode === 'receipt' ? (
                <VStack space="md">
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold">
                      {t('transactions.customer')} *
                    </Text>
                    <Box borderWidth={1} borderColor="$borderLight300" borderRadius={8} mt="$1">
                      <ScrollView style={{ maxHeight: 200 }}>
                        {(customersQ.data ?? []).map((c) => (
                          <Pressable
                            key={c.id}
                            p="$2"
                            bg={rCustomer === c.id ? '$primary100' : 'transparent'}
                            onPress={() => setRCustomer(c.id)}
                          >
                            <Text>{c.customer_name}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </Box>
                  </VStack>
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold">
                      {t('transactions.date')} *
                    </Text>
                    <Input mt="$1">
                      <InputField value={rDate} onChangeText={setRDate} placeholder="YYYY-MM-DD" />
                    </Input>
                  </VStack>
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold">
                      {t('transactions.amount')} *
                    </Text>
                    <Input mt="$1">
                      <InputField value={rAmount} onChangeText={setRAmount} keyboardType="decimal-pad" />
                    </Input>
                  </VStack>
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold" mb="$1">
                      {t('transactions.method')}
                    </Text>
                    <Box flexDirection="row" flexWrap="wrap" gap="$2">
                      {PAYMENT_METHOD.map((m) => (
                        <Pressable
                          key={m}
                          px="$3"
                          py="$1"
                          borderRadius="$full"
                          borderWidth={2}
                          style={{
                            backgroundColor: rMethod === m ? '#111827' : 'transparent',
                            borderColor: rMethod === m ? '#111827' : '#E5E7EB',
                          }}
                          onPress={() => setRMethod(m)}
                        >
                          <Text color={rMethod === m ? '$white' : '$textLight800'} fontSize={13}>
                            {m}
                          </Text>
                        </Pressable>
                      ))}
                    </Box>
                  </VStack>
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold">
                      {t('stock.notes')}
                    </Text>
                    <Textarea mt="$1">
                      <TextareaInput value={rNotes} onChangeText={setRNotes} />
                    </Textarea>
                  </VStack>
                  {receiptMut.isError ? (
                    <Text color="$red600" size="sm">
                      {t('save_error')}
                    </Text>
                  ) : null}
                  <Button
                    onPress={() => receiptMut.mutate()}
                    isDisabled={receiptMut.isPending || !rCustomer || !rAmount}
                    style={{ backgroundColor: GREEN }}
                  >
                    <ButtonText>{t('stock.save')}</ButtonText>
                  </Button>
                </VStack>
              ) : (
                <VStack space="md">
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold">
                      {t('money.recipient')} *
                    </Text>
                    <Input mt="$1">
                      <InputField value={pRecipient} onChangeText={setPRecipient} />
                    </Input>
                  </VStack>
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold">
                      {t('transactions.date')} *
                    </Text>
                    <Input mt="$1">
                      <InputField value={pDate} onChangeText={setPDate} />
                    </Input>
                  </VStack>
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold">
                      {t('transactions.amount')} *
                    </Text>
                    <Input mt="$1">
                      <InputField value={pAmount} onChangeText={setPAmount} keyboardType="decimal-pad" />
                    </Input>
                  </VStack>
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold" mb="$1">
                      {t('transactions.method')}
                    </Text>
                    <Box flexDirection="row" flexWrap="wrap" gap="$2">
                      {PAYMENT_METHOD.map((m) => (
                        <Pressable
                          key={m}
                          px="$3"
                          py="$1"
                          borderRadius="$full"
                          borderWidth={2}
                          style={{
                            backgroundColor: pMethod === m ? '#111827' : 'transparent',
                            borderColor: pMethod === m ? '#111827' : '#E5E7EB',
                          }}
                          onPress={() => setPMethod(m)}
                        >
                          <Text color={pMethod === m ? '$white' : '$textLight800'} fontSize={13}>
                            {m}
                          </Text>
                        </Pressable>
                      ))}
                    </Box>
                  </VStack>
                  <VStack>
                    <Text fontSize={14} fontWeight="$semibold">
                      {t('stock.notes')}
                    </Text>
                    <Textarea mt="$1">
                      <TextareaInput value={pNotes} onChangeText={setPNotes} />
                    </Textarea>
                  </VStack>
                  {paymentMut.isError ? (
                    <Text color="$red600" size="sm">
                      {t('save_error')}
                    </Text>
                  ) : null}
                  <Button
                    onPress={() => paymentMut.mutate()}
                    isDisabled={paymentMut.isPending || !pRecipient.trim() || !pAmount}
                    style={{ backgroundColor: PURPLE }}
                  >
                    <ButtonText>{t('stock.save')}</ButtonText>
                  </Button>
                </VStack>
              )}
            </ScrollView>
            <Button variant="outline" onPress={onClose}>
              <ButtonText>{t('stock.cancel')}</ButtonText>
            </Button>
          </VStack>
        </Box>
      </Box>
    </Modal>
  );
}
