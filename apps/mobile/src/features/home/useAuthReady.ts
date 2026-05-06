import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export function useAuthReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(false);
      return;
    }

    let cancelled = false;

    function applySession(session: Session | null) {
      if (!cancelled) setReady(!!session?.user);
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return ready;
}
