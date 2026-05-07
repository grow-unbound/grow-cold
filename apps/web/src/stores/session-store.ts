'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@growcold/shared';
import { create } from 'zustand';

export type AppRole = 'OWNER' | 'MANAGER' | 'STAFF';

const WAREHOUSE_LS_KEY = 'growcold-selected-warehouse-id';
const WAREHOUSE_COOKIE_NAME = 'gc_last_warehouse_id';

export type WarehouseOption = {
  id: string;
  warehouse_name: string;
};

type SessionState = {
  role: AppRole;
  displayName: string | null;
  phone: string | null;
  tenantName: string | null;
  warehouses: WarehouseOption[];
  selectedWarehouseId: string | null;
  hydrated: boolean;
  setRole: (role: AppRole) => void;
  setSelectedWarehouse: (id: string) => void;
  hydrate: (client: SupabaseClient<Database>) => Promise<void>;
  clearSession: () => void;
};

function readCookieWarehouseId(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${WAREHOUSE_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function writeWarehouseCookie(id: string) {
  if (typeof window === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 400;
  document.cookie = `${WAREHOUSE_COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function clearWarehouseCookie() {
  if (typeof window === 'undefined') return;
  document.cookie = `${WAREHOUSE_COOKIE_NAME}=; path=/; max-age=0`;
}

function readStoredWarehouseId(): string | null {
  if (typeof window === 'undefined') return null;
  const fromCookie = readCookieWarehouseId();
  if (fromCookie) return fromCookie;
  return localStorage.getItem(WAREHOUSE_LS_KEY);
}

function persistWarehouseId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WAREHOUSE_LS_KEY, id);
  writeWarehouseCookie(id);
}

function clearStoredWarehouseId() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WAREHOUSE_LS_KEY);
  clearWarehouseCookie();
}

export const useSessionStore = create<SessionState>((set, get) => ({
  role: 'STAFF',
  displayName: null,
  phone: null,
  tenantName: null,
  warehouses: [],
  selectedWarehouseId: null,
  hydrated: false,

  setRole: (role) => set({ role }),

  setSelectedWarehouse: (id) => {
    persistWarehouseId(id);
    set({ selectedWarehouseId: id });
  },

  clearSession: () => {
    clearStoredWarehouseId();
    set({
      role: 'STAFF',
      displayName: null,
      phone: null,
      tenantName: null,
      warehouses: [],
      selectedWarehouseId: null,
      hydrated: true,
    });
  },

  hydrate: async (client) => {
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      get().clearSession();
      return;
    }

    type AssignRow = {
      warehouse_id: string;
      warehouses: { id: string; warehouse_name: string } | null;
    };

    const [profileRes, roleRes, assignRes] = await Promise.all([
      client.from('user_profiles').select('display_name, phone').eq('id', user.id).maybeSingle(),
      client
        .from('user_roles')
        .select('role, tenant_id, tenants(name)')
        .eq('user_id', user.id)
        .maybeSingle(),
      client
        .from('user_warehouse_assignments')
        .select('warehouse_id, warehouses(id, warehouse_name)')
        .eq('user_id', user.id),
    ]);

    const roleRow = roleRes.data as
      | { role: string; tenant_id: string; tenants: { name: string } | null }
      | null;
    const tenantName = roleRow?.tenants?.name ?? null;

    const assignmentRows = (assignRes.data ?? []) as AssignRow[];
    const warehouses: WarehouseOption[] = assignmentRows
      .map((r) => {
        const w = r.warehouses;
        if (!w) return null;
        return { id: w.id, warehouse_name: w.warehouse_name };
      })
      .filter((x): x is WarehouseOption => x !== null)
      .sort((a, b) => a.warehouse_name.localeCompare(b.warehouse_name));

    if (warehouses.length === 0) {
      clearStoredWarehouseId();
    }

    const stored = readStoredWarehouseId();
    const storedValid = Boolean(stored && warehouses.some((w) => w.id === stored));
    const selectedWarehouseId = storedValid ? stored! : warehouses[0]?.id ?? null;

    if (warehouses.length > 0 && selectedWarehouseId && !storedValid) {
      persistWarehouseId(selectedWarehouseId);
    }

    set({
      role: (roleRow?.role as AppRole) ?? 'STAFF',
      displayName: profileRes.data?.display_name ?? null,
      phone: profileRes.data?.phone ?? null,
      tenantName,
      warehouses,
      selectedWarehouseId,
      hydrated: true,
    });
  },
}));

export function useSelectedWarehouseName(): string | null {
  const { warehouses, selectedWarehouseId } = useSessionStore();
  const w = warehouses.find((x) => x.id === selectedWarehouseId);
  return w?.warehouse_name ?? warehouses[0]?.warehouse_name ?? null;
}
