# GrowCold — Claude Context

## What We're Building
Mobile-first warehouse management app for rural/suburban Indian cold-storage SMBs.
Core problem: 15-25% revenue loss from inventory shrinkage, zero visibility, delayed collections.

## Stack (Non-Negotiable)
- **Mobile:** React Native + Expo
- **UI:** GlueStack UI
- **Web:** React + TypeScript
- **Backend/DB/Auth/Storage:** Supabase (PostgreSQL + RLS + Realtime)
- **Auth:** Supabase Auth — phone number + WhatsApp OTP (no email)
- **Validation:** Zod + TanStack Query
- **i18n:** react-i18next + expo-localization
- **Deployment:** App Store / Play Store (mobile), Vercel (web)

## Architecture Principles
- **Offline-first:** Core ops (inward, outward, stock check) must work 100% offline
- **Sync:** Queue to local store → sync on reconnect → timestamp-based conflict resolution
- **Multi-tenant:** Each warehouse = separate tenant, enforced via Supabase RLS
- **Optimistic UI:** Acknowledge first, sync in background
- **Performance:** <2s load on 3G, support 1000+ products, 500+ queued transactions

## Domain Language (Always Use)
| Use | Never use |
|-----|-----------|
| Stock | Inventory |
| Party / Customer | Client |
| Inward / Outward | Receiving / Shipping |
| Godown / Warehouse | Facility |
| Lot / Batch | SKU, ASN, BOL |

## Target User
- 35-60 yr old warehouse owner, uses WhatsApp, limited English
- Staff: even lower tech literacy, needs minimal-text UI
- Test every feature: "Can a 50-yr-old in rural Andhra Pradesh use this without a demo call?"

## UX Rules
- Mobile-first always (5-inch screen, fat fingers)
- Haptics + skeleton loaders + optimistic navigation
- Support Hindi/Telugu/Tamil/Bengali from day 1
- Date: DD/MM/YYYY | Currency: ₹ with lakhs/crores notation
- Default to fewest taps possible — if it takes >3 taps, redesign it

## Decision Priority (in order)
1. User simplicity
2. Offline capability
3. Mobile experience
4. Dev speed (ship in 1-2 sprints)
5. Localization-safe
6. Scalability
7. Maintenance burden

## Success Metrics
- Onboard without a demo call in <10 min
- 100% staff adoption (zero paper)
- Works through 4-hr internet outage
- 60%+ pilot → paid conversion in 30 days