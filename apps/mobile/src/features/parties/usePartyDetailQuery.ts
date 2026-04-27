import { fetchPartyDetail, type PartyDetailData } from '@growcold/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthReady } from '../home/useAuthReady';

function selectMerged(data: {
  pages: Array<PartyDetailData | null>;
  pageParams: number[];
}): PartyDetailData | null {
  const valid = data.pages.filter((p): p is PartyDetailData => p != null);
  if (valid.length === 0) return null;
  const last = valid[valid.length - 1]!;
  return {
    ...last,
    receipts: valid.flatMap((p) => p.receipts),
    receiptsHasMore: last.receiptsHasMore,
  };
}

export function usePartyDetailQuery(warehouseId: string | undefined, customerId: string | undefined) {
  const authReady = useAuthReady();
  return useInfiniteQuery({
    queryKey: ['party-detail', warehouseId, customerId],
    enabled: Boolean(supabase && authReady && warehouseId && customerId),
    initialPageParam: 0,
    staleTime: 60_000,
    queryFn: async ({ pageParam }) => {
      if (!supabase || !warehouseId || !customerId) return null;
      return fetchPartyDetail(supabase, warehouseId, customerId, {
        receiptsLimit: 50,
        receiptsOffset: pageParam,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.receiptsHasMore) return undefined;
      return allPages.reduce((sum, p) => sum + (p?.receipts.length ?? 0), 0);
    },
    select: selectMerged,
  });
}
