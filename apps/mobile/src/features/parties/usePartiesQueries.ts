import {
  fetchPartiesPage,
  fetchPartiesReceivablesSummary,
} from '@growcold/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthReady } from '../home/useAuthReady';
import { useWarehouseStore } from '../../stores/warehouse-store';

function usePartiesQueryEnabled(): boolean {
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  const authReady = useAuthReady();
  return !!supabase && authReady && warehouseId.length > 0;
}

export function usePartiesReceivablesQuery() {
  const enabled = usePartiesQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useQuery({
    queryKey: ['parties', 'receivables', warehouseId],
    enabled,
    staleTime: 45_000,
    queryFn: () => fetchPartiesReceivablesSummary(supabase!, warehouseId),
  });
}

export function usePartiesListQuery(filter: string, search: string, pageSize = 50) {
  const enabled = usePartiesQueryEnabled();
  const warehouseId = useWarehouseStore((s) => s.warehouseId);
  return useInfiniteQuery({
    queryKey: ['parties', 'list', warehouseId, filter, search, pageSize],
    enabled,
    initialPageParam: 0,
    staleTime: 30_000,
    queryFn: ({ pageParam }) =>
      fetchPartiesPage(supabase!, warehouseId, filter, search, pageSize, pageParam as number),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce((s, p) => s + p.items.length, 0);
    },
  });
}
