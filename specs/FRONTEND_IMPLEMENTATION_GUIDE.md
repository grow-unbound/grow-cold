# Cold Storage MVP: Frontend Implementation Guide

**Tech Stack**: React (web) + React Native (mobile)  
**State Management**: Zustand + TanStack Query  
**UI Framework**: Shadcn/ui (web), GlueStack UI (mobile)

**Navigation (web + mobile — keep consistent)**  
- **Bottom tabs (5):** Home (dashboard / summary), Inventory, Parties, Receipts, Payments  
- **Not** root tabs: Settings, warehouse switcher, profile → **user avatar menu** (items shown by **OWNER / MANAGER / STAFF**)

---

## PART 1: PROJECT STRUCTURE

### Web (React)
```
src/
├── pages/
│   ├── Home/
│   │   └── Home.tsx           (Dashboard summary + collections follow-up)
│   ├── Inventory/
│   │   └── Inventory.tsx      (Lot list with spoilage risk)
│   ├── Parties/
│   │   └── Parties.tsx
│   ├── Receipts/
│   │   └── Receipts.tsx       (Receipt recording / list)
│   ├── Payments/
│   │   └── Payments.tsx       (Payments / allocations UX)
│   └── ...                    (Settings / profile via header avatar, not a tab)
│
├── components/
│   ├── LotCard.tsx            (Reusable lot display)
│   ├── DeliveryModal.tsx      (Blocking logic + override)
│   ├── PaymentForm.tsx        (Receipt creation)
│   ├── LotDetailPanel.tsx     (Full lot info + history)
│   └── StatusBadge.tsx        (Color-coded status)
│
├── hooks/
│   ├── useLotsStore.ts        (Zustand)
│   ├── usePaymentStore.ts
│   ├── useSettingsStore.ts
│   ├── useLots.ts             (React Query)
│   ├── usePayments.ts
│   └── useDeliveryBlock.ts
│
├── api/
│   ├── client.ts              (Supabase client)
│   ├── lots.ts                (Lot endpoints)
│   ├── payments.ts            (Payment endpoints)
│   ├── settings.ts            (Settings endpoints)
│   └── dashboard.ts           (Dashboard endpoints)
│
├── utils/
│   ├── calculations.ts        (Outstanding, daysUntilStale)
│   ├── formatting.ts          (Date, currency)
│   └── constants.ts           (ENUMS, defaults)
│
├── types/
│   └── index.ts               (TypeScript interfaces)
│
└── App.tsx
```

### Mobile (React Native / Expo)

Mirror the **same five tabs**: `Home`, `Inventory`, `Parties`, `Receipts`, `Payments` under `src/screens/`. Use a **header avatar** (or profile slot) for Settings, warehouse switch, and profile — **role-aware** (OWNER / MANAGER / STAFF).

---

## PART 2: CORE HOOKS (State Management)

### useLotsStore (Zustand)
```typescript
// src/hooks/useLotsStore.ts

import { create } from 'zustand'

interface Lot {
  id: string
  customerID: string
  customerName: string
  productName: string
  originalBags: number
  balanceBags: number
  lodgementDate: string
  status: 'ACTIVE' | 'STALE' | 'DELIVERED' | 'CLEARED' | 'WRITTEN_OFF' | 'DISPUTED'
  rentalMode: string
  rentalAmount: number
  daysOld: number
  staleDaysLimit: number | null
  daysUntilStale: number
  isStale: boolean
  outstanding: number
  daysOutstanding: number | null
  spoilageRiskLevel: 'green' | 'yellow' | 'red'
}

interface LotsState {
  lots: Lot[]
  selectedLot: Lot | null
  filters: {
    warehouseID: string
    status: string[]
    customerID?: string
    sortBy: string
  }
  pagination: {
    limit: number
    offset: number
    total: number
  }

  // Actions
  setLots: (lots: Lot[]) => void
  selectLot: (lot: Lot | null) => void
  setFilters: (filters: Partial<LotsState['filters']>) => void
  setPagination: (pagination: Partial<LotsState['pagination']>) => void
  updateLot: (id: string, updates: Partial<Lot>) => void
  removeLot: (id: string) => void
}

export const useLotsStore = create<LotsState>((set) => ({
  lots: [],
  selectedLot: null,
  filters: {
    warehouseID: '',
    status: [],
    sortBy: 'lodgementDate'
  },
  pagination: {
    limit: 50,
    offset: 0,
    total: 0
  },

  setLots: (lots) => set({ lots }),
  selectLot: (lot) => set({ selectedLot: lot }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
    pagination: { ...state.pagination, offset: 0 } // Reset pagination
  })),
  setPagination: (pagination) => set((state) => ({
    pagination: { ...state.pagination, ...pagination }
  })),
  updateLot: (id, updates) => set((state) => ({
    lots: state.lots.map((lot) => lot.id === id ? { ...lot, ...updates } : lot),
    selectedLot: state.selectedLot?.id === id ? { ...state.selectedLot, ...updates } : state.selectedLot
  })),
  removeLot: (id) => set((state) => ({
    lots: state.lots.filter((lot) => lot.id !== id),
    selectedLot: state.selectedLot?.id === id ? null : state.selectedLot
  }))
}))
```

### useLots (React Query)
```typescript
// src/hooks/useLots.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLotsStore } from './useLotsStore'
import * as lotsAPI from '@/api/lots'

export const useLots = () => {
  const { filters, pagination, setLots, setPagination } = useLotsStore()
  const queryClient = useQueryClient()

  // Fetch lots
  const query = useQuery({
    queryKey: ['lots', filters, pagination],
    queryFn: () => lotsAPI.getLots({
      warehouseID: filters.warehouseID,
      status: filters.status,
      sortBy: filters.sortBy,
      limit: pagination.limit,
      offset: pagination.offset
    }),
    onSuccess: (data) => {
      setLots(data.data)
      setPagination({ total: data.pagination.total })
    }
  })

  // Record delivery
  const deliveryMutation = useMutation({
    mutationFn: (params: {
      lotID: string
      numBagsOut: number
      deliveryNotes: string
    }) => lotsAPI.recordDelivery(params.lotID, {
      numBagsOut: params.numBagsOut,
      deliveryNotes: params.deliveryNotes
    }),
    onSuccess: (data) => {
      // If 409 (blocked), return error for modal handling
      if (data.status === 409) {
        throw new Error(data.code)
      }
      queryClient.invalidateQueries(['lots'])
    }
  })

  // Override delivery
  const overrideMutation = useMutation({
    mutationFn: (params: { lotID: string; overrideReason: string }) =>
      lotsAPI.overrideDelivery(params.lotID, { overrideReason: params.overrideReason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lots'])
    }
  })

  // Mark written-off
  const writtenOffMutation = useMutation({
    mutationFn: (params: { lotID: string; reason: string }) =>
      lotsAPI.markWrittenOff(params.lotID, { reason: params.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['lots'])
    }
  })

  return {
    query,
    deliveryMutation,
    overrideMutation,
    writtenOffMutation,
    isLoading: query.isLoading,
    error: query.error
  }
}

export const useDeliveryBlock = () => {
  /**
   * Custom hook to handle delivery blocking logic
   * Returns: { canDeliver, isFinal, isBlocked, requiresOverride, outstanding }
   */
  const handleDelivery = (lot: Lot, numBagsOut: number) => {
    const isFinal = lot.balanceBags - numBagsOut === 0
    const isBlocked = isFinal && lot.outstanding > 0

    return {
      canDeliver: !isBlocked,
      isFinal,
      isBlocked,
      requiresOverride: isBlocked,
      outstanding: lot.outstanding
    }
  }

  return { handleDelivery }
}
```

---

## PART 3: CORE COMPONENTS

### DeliveryModal
```typescript
// src/components/DeliveryModal.tsx

import React, { useState } from 'react'
import { Dialog, Button, Input, Textarea } from '@/components/ui'
import { useDeliveryBlock } from '@/hooks/useDeliveryBlock'
import { useLots } from '@/hooks/useLots'

interface DeliveryModalProps {
  lot: Lot
  isOpen: boolean
  onClose: () => void
  userRole: 'ADMIN' | 'OWNER' | 'OPS_MANAGER'
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  lot,
  isOpen,
  onClose,
  userRole
}) => {
  const [numBagsOut, setNumBagsOut] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [showOverride, setShowOverride] = useState(false)

  const { handleDelivery } = useDeliveryBlock()
  const { deliveryMutation, overrideMutation } = useLots()

  const delivery = handleDelivery(lot, numBagsOut)

  const handleConfirmDelivery = async () => {
    try {
      if (delivery.isBlocked) {
        // Show override form
        setShowOverride(true)
        return
      }

      await deliveryMutation.mutateAsync({
        lotID: lot.id,
        numBagsOut,
        deliveryNotes: notes
      })
      onClose()
    } catch (error) {
      console.error('Delivery error:', error)
    }
  }

  const handleOverride = async () => {
    if (userRole !== 'OWNER') {
      alert('Only owner can override delivery block')
      return
    }

    try {
      await overrideMutation.mutateAsync({
        lotID: lot.id,
        overrideReason
      })
      onClose()
    } catch (error) {
      console.error('Override error:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="space-y-4 p-6">
        {/* Normal Delivery */}
        {!showOverride && (
          <>
            <h2 className="text-lg font-bold">Record Delivery</h2>
            <div>
              <label>Bags to deliver (max: {lot.balanceBags})</label>
              <Input
                type="number"
                value={numBagsOut}
                onChange={(e) => setNumBagsOut(parseInt(e.target.value))}
                max={lot.balanceBags}
              />
            </div>
            <div>
              <label>Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery details..."
              />
            </div>

            {/* Warning for Normal Delivery with Outstanding */}
            {delivery.isFinal && lot.outstanding > 0 ? (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <p className="text-red-700 font-semibold">🔴 Cannot deliver final bags</p>
                <p className="text-red-600 text-sm">
                  Customer has outstanding ₹{lot.outstanding.toLocaleString('en-IN')}.
                  Contact owner to approve.
                </p>
              </div>
            ) : delivery.isFinal && lot.outstanding === 0 ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <p className="text-green-700 text-sm">✓ All dues cleared. Final delivery allowed.</p>
              </div>
            ) : lot.outstanding > 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-yellow-700 font-semibold">⚠️ Customer outstanding</p>
                <p className="text-yellow-600 text-sm">
                  Customer owes ₹{lot.outstanding.toLocaleString('en-IN')}. Confirm delivery?
                </p>
              </div>
            ) : null}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelivery}
                disabled={numBagsOut <= 0 || delivery.isBlocked}
              >
                {delivery.isBlocked ? 'Blocked (Contact Owner)' : 'Confirm Delivery'}
              </Button>
            </div>
          </>
        )}

        {/* Owner Override Form */}
        {showOverride && userRole === 'OWNER' && (
          <>
            <h2 className="text-lg font-bold">Override Delivery Block</h2>
            <div className="bg-orange-50 border border-orange-200 p-3 rounded">
              <p className="text-orange-700 text-sm">
                Customer outstanding: ₹{lot.outstanding.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <label>Reason for override *</label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g., Payment received OTC, customer dispute resolved..."
                required
              />
            </div>
            <p className="text-sm text-gray-500">This will be logged and admins notified.</p>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowOverride(false)}>
                Back
              </Button>
              <Button
                onClick={handleOverride}
                disabled={!overrideReason.trim()}
                variant="destructive"
              >
                Override & Deliver
              </Button>
            </div>
          </>
        )}

        {showOverride && userRole !== 'OWNER' && (
          <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700">
            Only warehouse owner can override delivery block. Contact them to proceed.
          </div>
        )}
      </div>
    </Dialog>
  )
}
```

### LotCard
```typescript
// src/components/LotCard.tsx

import React from 'react'
import { Card, Badge, Button } from '@/components/ui'
import { getStatusColor, getRiskLevel } from '@/utils/formatting'

interface LotCardProps {
  lot: Lot
  onSelect: (lot: Lot) => void
  onDeliver: (lot: Lot) => void
  userRole: 'ADMIN' | 'OWNER' | 'OPS_MANAGER'
}

export const LotCard: React.FC<LotCardProps> = ({ lot, onSelect, onDeliver, userRole }) => {
  return (
    <Card className="p-4 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">Lot #{lot.id.slice(-6)}</h3>
          <p className="text-sm text-gray-500">{lot.customerName}</p>
        </div>
        <Badge
          variant={lot.status === 'ACTIVE' ? 'default' : 'secondary'}
          className={getStatusColor(lot.status)}
        >
          {lot.status}
        </Badge>
      </div>

      {/* Product & Bags */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Product</p>
          <p className="font-semibold">{lot.productName}</p>
        </div>
        <div>
          <p className="text-gray-500">Balance</p>
          <p className="font-semibold">{lot.balanceBags} bags</p>
        </div>
      </div>

      {/* Spoilage Risk */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Spoilage Risk</span>
          <Badge variant={getRiskLevel(lot.spoilageRiskLevel)}>
            {lot.isStale ? '🔴 STALE' : `${lot.daysUntilStale} days`}
          </Badge>
        </div>
        {lot.isStale && (
          <p className="text-xs text-red-600 mt-1">
            {lot.daysOld} days old (limit: {lot.staleDaysLimit || 180} days)
          </p>
        )}
      </div>

      {/* Outstanding */}
      {lot.outstanding > 0 && (
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-yellow-700">
            <strong>Outstanding: ₹{lot.outstanding.toLocaleString('en-IN')}</strong>
          </p>
          {lot.daysOutstanding && (
            <p className="text-xs text-yellow-600">{lot.daysOutstanding} days since lodgement</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1 text-sm"
          onClick={() => onSelect(lot)}
        >
          Details
        </Button>
        {userRole !== 'OPS_MANAGER' && (
          <Button variant="outline" className="flex-1 text-sm">
            More
          </Button>
        )}
        {(userRole === 'OPS_MANAGER' || userRole === 'ADMIN') && lot.balanceBags > 0 && (
          <Button
            variant="default"
            className="flex-1 text-sm"
            onClick={() => onDeliver(lot)}
          >
            Deliver
          </Button>
        )}
      </div>
    </Card>
  )
}
```

### StatusBadge
```typescript
// src/components/StatusBadge.tsx

const statusColors = {
  ACTIVE: 'bg-blue-100 text-blue-800',
  STALE: 'bg-red-100 text-red-800',
  DELIVERED: 'bg-yellow-100 text-yellow-800',
  CLEARED: 'bg-green-100 text-green-800',
  WRITTEN_OFF: 'bg-gray-100 text-gray-800',
  DISPUTED: 'bg-orange-100 text-orange-800'
}

const riskLevelColors = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800'
}

export const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-100'
export const getRiskLevel = (level: string) => riskLevelColors[level] || 'bg-gray-100'
```

---

## PART 4: PAGE COMPONENTS

### Inventory.tsx (Main Lot List)
```typescript
// src/pages/Dashboard/Inventory.tsx

import React, { useState } from 'react'
import { useLotsStore } from '@/hooks/useLotsStore'
import { useLots } from '@/hooks/useLots'
import { LotCard } from '@/components/LotCard'
import { DeliveryModal } from '@/components/DeliveryModal'
import { LotDetailPanel } from '@/components/LotDetailPanel'
import { Select, Input, Pagination } from '@/components/ui'

export const Inventory: React.FC = () => {
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)

  const { lots, filters, pagination, setFilters, setPagination } = useLotsStore()
  const { query, isLoading } = useLots()

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ [key]: value })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={filters.status[0] || ''}
          onChange={(val) => handleFilterChange('status', val ? [val] : [])}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="STALE">Stale</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CLEARED">Cleared</option>
        </Select>
      </div>

      {/* Lot Cards */}
      <div className="grid grid-cols-1 gap-4">
        {lots.map((lot) => (
          <LotCard
            key={lot.id}
            lot={lot}
            onSelect={setSelectedLot}
            onDeliver={(l) => {
              setSelectedLot(l)
              setDeliveryModalOpen(true)
            }}
            userRole={userRole}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        limit={pagination.limit}
        offset={pagination.offset}
        total={pagination.total}
        onPaginationChange={(offset) => setPagination({ offset })}
      />

      {/* Modals */}
      <DeliveryModal
        lot={selectedLot!}
        isOpen={deliveryModalOpen && selectedLot !== null}
        onClose={() => setDeliveryModalOpen(false)}
        userRole={userRole}
      />

      {selectedLot && (
        <LotDetailPanel
          lot={selectedLot}
          onClose={() => setSelectedLot(null)}
          userRole={userRole}
        />
      )}
    </div>
  )
}
```

### Home.tsx (Dashboard)
```typescript
// src/pages/Dashboard/Home.tsx

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import * as dashboardAPI from '@/api/dashboard'
import { Card, Stat, Button } from '@/components/ui'

export const Home: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['dashboard-home'],
    queryFn: () => dashboardAPI.getHome()
  })

  if (!data) return <div>Loading...</div>

  const { summary, collectionsFollowUpDue } = data.data

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <Stat
            label="Active Lots"
            value={summary.activeLotsCount}
            trend="neutral"
          />
        </Card>
        <Card>
          <Stat
            label="Stale Lots"
            value={summary.staleLotsCount}
            trend="negative"
          />
        </Card>
        <Card>
          <Stat
            label="Total Outstanding"
            value={`₹${summary.totalOutstandingAmount.toLocaleString('en-IN')}`}
          />
        </Card>
        <Card>
          <Stat
            label="Blocked Deliveries"
            value={summary.deliveriesBlockedToday}
          />
        </Card>
      </div>

      {/* Collections Follow-up Due */}
      {collectionsFollowUpDue.length > 0 && (
        <Card className="p-6">
          <h2 className="font-bold text-lg mb-4">
            Collections Follow-up Due ({collectionsFollowUpDue.length})
          </h2>
          <div className="space-y-2">
            {collectionsFollowUpDue.map((item) => (
              <div key={item.customerID} className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <div>
                  <p className="font-semibold">{item.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {item.daysOutstanding} days, ₹{item.outstanding.toLocaleString('en-IN')} outstanding
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Follow Up
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
```

---

## PART 5: UTILITIES & HELPERS

### calculations.ts
```typescript
// src/utils/calculations.ts

export const calculateDaysOld = (lodgementDate: string): number => {
  const lodgeDate = new Date(lodgementDate)
  const today = new Date()
  return Math.floor((today.getTime() - lodgeDate.getTime()) / (1000 * 60 * 60 * 24))
}

export const calculateDaysUntilStale = (
  lodgementDate: string,
  staleDaysLimit: number | null,
  blanketStaleDays: number = 180
): number => {
  const daysOld = calculateDaysOld(lodgementDate)
  const limit = staleDaysLimit || blanketStaleDays
  return Math.max(0, limit - daysOld)
}

export const getSpoilageRiskLevel = (daysUntilStale: number): 'green' | 'yellow' | 'red' => {
  if (daysUntilStale > 30) return 'green'
  if (daysUntilStale >= 10) return 'yellow'
  return 'red'
}

export const calculateOutstanding = (rents: any[], charges: any[]): number => {
  return rents
    .filter((r) => !r.isPaid)
    .reduce((sum, r) => sum + r.rentalAmount, 0) +
    charges
      .filter((c) => !c.isPaid)
      .reduce((sum, c) => sum + c.chargeAmount, 0)
}
```

### formatting.ts
```typescript
// src/utils/formatting.ts

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency
  }).format(amount)
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN')
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    STALE: 'bg-red-100 text-red-800',
    DELIVERED: 'bg-yellow-100 text-yellow-800',
    CLEARED: 'bg-green-100 text-green-800',
    WRITTEN_OFF: 'bg-gray-100 text-gray-800',
    DISPUTED: 'bg-orange-100 text-orange-800'
  }
  return colors[status] || 'bg-gray-100'
}
```

---

## PART 6: ROLE-BASED ACCESS CONTROL (Frontend)

```typescript
// src/utils/permissions.ts

const permissions = {
  ADMIN: {
    viewAllLots: true,
    viewSettings: true,
    createLot: true,
    recordDelivery: true,
    overrideDelivery: true,
    writeOff: false, // Owner only
    dispute: false, // Owner only
    manualReallocate: true,
    deleteReceipt: true
  },
  OWNER: {
    viewAllLots: true,
    viewSettings: true,
    createLot: true,
    recordDelivery: true,
    overrideDelivery: true,
    writeOff: true,
    dispute: true,
    manualReallocate: true,
    deleteReceipt: false
  },
  OPS_MANAGER: {
    viewAllLots: false, // Only ACTIVE/STALE
    viewSettings: false,
    createLot: false,
    recordDelivery: true,
    overrideDelivery: false,
    writeOff: false,
    dispute: false,
    manualReallocate: false,
    deleteReceipt: false
  }
}

export const can = (role: 'ADMIN' | 'OWNER' | 'OPS_MANAGER', action: string): boolean => {
  return permissions[role][action] || false
}
```

---

## PART 7: REACT NATIVE MOBILE (Key Differences)

### Navigation Structure
```typescript
// src/mobile/navigation/RootNavigator.tsx

import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { HomeScreen } from '@/mobile/screens/HomeScreen'
import { InventoryScreen } from '@/mobile/screens/InventoryScreen'
import { DeliveryScreen } from '@/mobile/screens/DeliveryScreen'
import { PaymentScreen } from '@/mobile/screens/PaymentScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

export const RootNavigator = () => (
  <NavigationContainer>
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Delivery" component={DeliveryScreen} />
      <Tab.Screen name="Payment" component={PaymentScreen} />
    </Tab.Navigator>
  </NavigationContainer>
)
```

### Mobile-Specific Delivery Form
```typescript
// src/mobile/screens/DeliveryScreen.tsx

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import { useLots } from '@/hooks/useLots'

export const DeliveryScreen = () => {
  const route = useRoute()
  const [numBagsOut, setNumBagsOut] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { deliveryMutation } = useLots()

  const handleSubmit = async () => {
    if (!numBagsOut || numBagsOut === '0') {
      Alert.alert('Validation', 'Enter bags to deliver')
      return
    }

    setIsSubmitting(true)
    try {
      await deliveryMutation.mutateAsync({
        lotID: route.params.lotID,
        numBagsOut: parseInt(numBagsOut),
        deliveryNotes: notes
      })
      Alert.alert('Success', 'Delivery recorded')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-6">Record Delivery</Text>

      {/* Form Fields */}
      <View className="mb-4">
        <Text className="font-semibold mb-2">Bags to Deliver</Text>
        <TextInput
          keyboardType="number-pad"
          value={numBagsOut}
          onChangeText={setNumBagsOut}
          placeholder="Enter number of bags"
          className="border border-gray-300 p-3 rounded"
        />
      </View>

      <View className="mb-4">
        <Text className="font-semibold mb-2">Delivery Notes</Text>
        <TextInput
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add delivery notes..."
          className="border border-gray-300 p-3 rounded"
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isSubmitting}
        className="bg-blue-600 p-4 rounded items-center"
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold">Record Delivery</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}
```

---

## PART 8: OFFLINE SUPPORT (React Native)

```typescript
// src/mobile/hooks/useOfflineSync.ts

import { useQuery, useMutation } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useOfflineSync = () => {
  // Cache lots locally
  const cacheLots = async (lots: Lot[]) => {
    await AsyncStorage.setItem('cachedLots', JSON.stringify(lots))
  }

  const getCachedLots = async (): Promise<Lot[]> => {
    const cached = await AsyncStorage.getItem('cachedLots')
    return cached ? JSON.parse(cached) : []
  }

  // Queue operations when offline
  const queueDelivery = async (delivery: any) => {
    const queue = JSON.parse(
      await AsyncStorage.getItem('deliveryQueue') || '[]'
    )
    queue.push(delivery)
    await AsyncStorage.setItem('deliveryQueue', JSON.stringify(queue))
  }

  const syncQueue = async () => {
    const queue = JSON.parse(
      await AsyncStorage.getItem('deliveryQueue') || '[]'
    )
    for (const delivery of queue) {
      // Submit delivery to API
      // If successful, remove from queue
    }
  }

  return { cacheLots, getCachedLots, queueDelivery, syncQueue }
}
```

---

## APPENDIX: Testing Strategy

### Unit Tests (vitest)
- Calculations (daysOld, daysUntilStale, outstanding)
- Role-based permissions

### Component Tests (React Testing Library)
- DeliveryModal: Blocking, override, success flows
- LotCard: Spoilage display, status badges

### E2E Tests (Cypress)
- Complete lot lifecycle: Create → Deliver (normal) → Deliver (blocked) → Override → Payment
- Final delivery scenario: Assert 409 response
- Collections follow-up: Trigger at 30+ days

