import { fetchLotDetailPayload } from '@growcold/shared';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function useLotDetailQuery(lotId: string | undefined) {
  return useQuery({
    queryKey: ['lot-detail', lotId],
    enabled: Boolean(lotId && supabase),
    queryFn: async () => {
      if (!supabase || !lotId) throw new Error('Missing Supabase client or lot id');
      const { data: lot, error } = await supabase.from('lots').select('*').eq('id', lotId).maybeSingle();
      if (error) throw error;
      if (!lot) return null;
      return fetchLotDetailPayload(supabase, lot, lotId);
    },
  });
}
