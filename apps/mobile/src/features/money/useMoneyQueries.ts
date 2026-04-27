import {
  fetchMoneyTabMovements,
  fetchMoneyTabSummary,
} from '@growcold/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthReady } from '../home/useAuthReady';
import { useWarehouseStore } from '../../stores/warehouse-store';

function useMoneyQueryEnabled(): boolean {
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const authReady = useAuthReady();
  return !!supabase && authReady && warehouseId.length > 0;
}

export function useMoneySummaryQuery() {
  const enabled = useMoneyQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useQuery({
    queryKey: ['money', 'summary', warehouseId],
    enabled,
    staleTime: 45_000,
    queryFn: () => fetchMoneyTabSummary(supabase!, warehouseId, new Date()),
  });
}

export function useMoneyMovementsQuery(pageSize = 20) {
  const enabled = useMoneyQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useInfiniteQuery({
    queryKey: ['money', 'movements', warehouseId, pageSize],
    enabled,
    initialPageParam: null as string | null,
    staleTime: 30_000,
    queryFn: ({ pageParam }) =>
      fetchMoneyTabMovements(supabase!, warehouseId, pageSize, pageParam ?? null),
    getNextPageParam: (last) => (last.hasMore && last.nextCursor ? last.nextCursor : undefined),
  });
}
