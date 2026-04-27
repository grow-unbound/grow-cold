import AsyncStorage from '@react-native-async-storage/async-storage';
import { createGrowColdSupabaseClient } from '@growcold/shared';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Supabase browser client for Expo; null when env is not configured (UI shows empty states). */
export const supabase =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0
    ? createGrowColdSupabaseClient({
        supabaseUrl,
        supabaseAnonKey,
        options: {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        },
      })
    : null;
