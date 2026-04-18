'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@growcold/shared';
import { create } from 'zustand';

export type AppRole = 'OWNER' | 'MANAGER' | 'STAFF';

const WAREHOUSE_LS_KEY = 'growcold-selected-warehouse-id';

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

function readStoredWarehouseId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(WAREHOUSE_LS_KEY);
}

function persistWarehouseId(id: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WAREHOUSE_LS_KEY, id);
}

function clearStoredWarehouseId() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WAREHOUSE_LS_KEY);
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

    const { data: profile } = await client
      .from('user_profiles')
      .select('display_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    const { data: roleRow } = await client
      .from('user_roles')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let tenantName: string | null = null;
    if (roleRow?.tenant_id) {
      const { data: tenant } = await client.from('tenants').select('name').eq('id', roleRow.tenant_id).maybeSingle();
      tenantName = tenant?.name ?? null;
    }

    const { data: assignmentRows } = await client
      .from('user_warehouse_assignments')
      .select('warehouse_id')
      .eq('user_id', user.id);

    const warehouseIds = assignmentRows?.map((r) => r.warehouse_id) ?? [];
    let warehouses: WarehouseOption[] = [];
    if (warehouseIds.length > 0) {
      const { data: whRows } = await client
        .from('warehouses')
        .select('id, warehouse_name')
        .in('id', warehouseIds)
        .order('warehouse_name');
      warehouses =
        whRows?.map((w) => ({ id: w.id, warehouse_name: w.warehouse_name })) ?? [];
    }

    if (warehouses.length === 0) {
      clearStoredWarehouseId();
    }

    const stored = readStoredWarehouseId();
    const storedValid = Boolean(stored && warehouses.some((w) => w.id === stored));
    const selectedWarehouseId =
      storedValid ? stored! : warehouses[0]?.id ?? null;

    if (warehouses.length > 0 && selectedWarehouseId && !storedValid) {
      persistWarehouseId(selectedWarehouseId);
    }

    set({
      role: (roleRow?.role as AppRole) ?? 'STAFF',
      displayName: profile?.display_name ?? null,
      phone: profile?.phone ?? null,
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
