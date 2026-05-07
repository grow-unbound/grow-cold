'use client';

import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@/lib/use-debounced-value';

export interface GlobalSearchParty {
  customerId: string;
  customerName: string;
  customerCode: string;
}

export interface GlobalSearchLot {
  id: string;
  lotNumber: string;
  customerName: string;
  productName: string;
}

interface SearchResponse {
  data: {
    parties: GlobalSearchParty[];
    lots: GlobalSearchLot[];
  } | null;
  error: { code: string; message: string } | null;
}

export function useGlobalSearchQuery(
  warehouseId: string | null,
  query: string,
  enabled: boolean,
  errorLabel: string,
) {
  const debounced = useDebouncedValue(query.trim(), 300);

  const searchQ = useQuery({
    queryKey: ['global-search-web', warehouseId, debounced],
    enabled: Boolean(enabled && warehouseId && debounced.length >= 2),
    queryFn: async (): Promise<{ parties: GlobalSearchParty[]; lots: GlobalSearchLot[] }> => {
      const u = new URL('/api/search/global', window.location.origin);
      u.searchParams.set('warehouseId', warehouseId!);
      u.searchParams.set('q', debounced);
      const res = await fetch(u.toString(), { credentials: 'same-origin' });
      const body = (await res.json()) as SearchResponse;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? errorLabel);
      }
      return body.data ?? { parties: [], lots: [] };
    },
  });

  const parties = debounced.length >= 2 ? (searchQ.data?.parties ?? []) : [];
  const lots = debounced.length >= 2 ? (searchQ.data?.lots ?? []) : [];
  const loading = debounced.length >= 2 && searchQ.isFetching;
  const errMsg =
    debounced.length >= 2 && searchQ.isError
      ? searchQ.error instanceof Error
        ? searchQ.error.message
        : errorLabel
      : null;

  const hasResults = parties.length > 0 || lots.length > 0;
  const showEmpty = debounced.length >= 2 && !loading && !errMsg && !hasResults;
  const trimmed = query.trim();
  const showMinCharsHint =
    Boolean(warehouseId) && trimmed.length > 0 && trimmed.length < 2;

  return {
    debounced,
    parties,
    lots,
    loading,
    errMsg,
    showEmpty,
    showMinCharsHint,
    hasResults,
  };
}
