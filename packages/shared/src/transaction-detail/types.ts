export type TransactionDetailKind = 'receipt' | 'payment';

export interface TransactionDetailData {
  kind: TransactionDetailKind;
  id: string;
  /** Shown in header after # — reference or short id */
  headerReference: string;
  amount: number;
  paymentMethod: string | null;
  displayDateTime: string;
  createdAt: string;
  customerOrRecipient: string;
  customerCode: string | null;
  /**
   * When null, the row was not attributed to a user — UI shows “System (Auto)”.
   * When a non-empty string (including the em dash), show that value.
   */
  recordedByName: string | null;
  purposeText: string;
  notesText: string;
  referenceNumber: string | null;
  showAllocationPlaceholder: boolean;
}
