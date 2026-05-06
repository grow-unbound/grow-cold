import { fetchStockTabMovements, fetchStockTabSummary } from '@growcold/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthReady } from '../home/useAuthReady';
import { useWarehouseStore } from '../../stores/warehouse-store';

function useStockQueryEnabled(): boolean {
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const authReady = useAuthReady();
  return !!supabase && authReady && warehouseId.length > 0;
}

export function useStockSummaryQuery() {
  const enabled = useStockQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useQuery({
    queryKey: ['stock', 'summary', warehouseId],
    enabled,
    staleTime: 45_000,
    queryFn: () => fetchStockTabSummary(supabase!, warehouseId, new Date()),
  });
}

export function useStockMovementsQuery(pageSize = 20) {
  const enabled = useStockQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useInfiniteQuery({
    queryKey: ['stock', 'movements', warehouseId, pageSize],
    enabled,
    initialPageParam: null as string | null,
    staleTime: 30_000,
    queryFn: ({ pageParam }) =>
      fetchStockTabMovements(supabase!, warehouseId, pageSize, pageParam ?? null),
    getNextPageParam: (last) => (last.hasMore && last.nextCursor ? last.nextCursor : undefined),
  });
}
