import { create } from 'zustand';

/**
 * Active warehouse for dashboard queries. Set via EXPO_PUBLIC_DEV_WAREHOUSE_ID until
 * in-app warehouse selection ships.
 */
const defaultWarehouseId = process.env.EXPO_PUBLIC_DEV_WAREHOUSE_ID ?? '';

interface WarehouseState {
  warehouseId: string;
  setWarehouseId: (id: string) => void;
}

export const useWarehouseStore = create<WarehouseState>((set) => ({
  warehouseId: defaultWarehouseId,
  setWarehouseId: (warehouseId) => set({ warehouseId }),
}));
