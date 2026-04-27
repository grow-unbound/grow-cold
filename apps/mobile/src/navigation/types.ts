export type RootStackParamList = {
  Main: undefined;
  LotDetail: { lotId: string };
  TransactionDetail: { id: string; kind: 'receipt' | 'payment' };
  PartyDetail: { customerId: string };
};
