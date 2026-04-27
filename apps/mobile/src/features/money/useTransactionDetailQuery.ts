import { fetchTransactionDetailPayload, type TransactionDetailKind } from '@growcold/shared';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function useTransactionDetailQuery(kind: TransactionDetailKind | undefined, id: string | undefined) {
  return useQuery({
    queryKey: ['transaction-detail', kind, id],
    enabled: Boolean(supabase && kind && id),
    queryFn: async () => {
      if (!supabase || !kind || !id) return null;
      return fetchTransactionDetailPayload(supabase, kind, id);
    },
    staleTime: 60_000,
  });
}
