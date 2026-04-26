/**
 * Bulk import for tenant "Sri Sai Cold Storage" / warehouse "Padala" from data/*.csv
 * Loads repo-root `.env.local` then `.env` (KEY=VALUE); does not override existing process.env.
 * Repeat-run-safe: reuses tenant/warehouse/catalog/lots/deliveries when natural keys match.
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Usage: pnpm import:sri-sai
 * Optional: DRY_RUN=1 to validate and log counts only
 * Optional: IMPORT_LOTS_ONLY=1 to import lots-and-deliveries only (uses DB; requires catalog/customers/locations present)
 * Optional: pnpm import:sri-sai:lots (same as IMPORT_LOTS_ONLY=1)
 */
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA = join(ROOT, 'data');

function log(msg, extra) {
  const ts = new Date().toISOString();
  if (extra !== undefined) console.log(`[import ${ts}] ${msg}`, extra);
  else console.log(`[import ${ts}] ${msg}`);
}

/** Load `.env.local` then `.env` at repo root (Next-style); skips missing files. */
function loadRootEnvFiles() {
  for (const name of ['.env.local', '.env']) {
    const p = join(ROOT, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, 'utf8');
    for (const line of text.split('\n')) {
      let trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.startsWith('export ')) trimmed = trimmed.slice(7).trim();
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

loadRootEnvFiles();

const TENANT_NAME = 'Sri Sai Cold Storage';
const WAREHOUSE_NAME = 'Padala';
const WAREHOUSE_CODE = 'WH-PADALA';

const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const IMPORT_LOTS_ONLY =
  process.env.IMPORT_LOTS_ONLY === '1' || process.env.IMPORT_LOTS_ONLY === 'true';

const PAGE_SIZE = 1000;
const IN_CHUNK = 200;

/** Paginated select; PostgREST max row default 1000. */
async function fetchAllPaged(fromBuilder) {
  const all = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await fromBuilder().range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return all;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function readCsv(name) {
  const path = join(DATA, name);
  return parse(readFileSync(path, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
}

function parseUsDate(s) {
  if (s == null || s === '') return null;
  const [m, d, y] = String(s)
    .split('/')
    .map((x) => parseInt(x, 10));
  if (!m || !d || !y) return null;
  return new Date(y, m - 1, d);
}

function toIsoDate(d) {
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function rentalModeFromDate(d) {
  if (!d) return 'MONTHLY';
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (m < 5 || (m === 5 && day <= 31)) return 'YEARLY';
  return 'MONTHLY';
}

function num(s) {
  if (s == null || s === '') return 0;
  const n = Number(String(s).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function customerKey(code, name) {
  return `${String(code).trim()}|${String(name).trim()}`;
}

function lotKey(warehouseId, lotNumber) {
  return `${warehouseId}|${String(lotNumber).trim()}`;
}

function splitLocationNames(legacy) {
  if (legacy == null || legacy === '' || legacy === '0') return [];
  return String(legacy)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Select-or-insert product_group by (tenant, name, parent). */
async function ensureProductGroup(supabase, tenantId, name, parentProductGroupId) {
  let q = supabase.from('product_groups').select('id').eq('tenant_id', tenantId).eq('name', name);
  if (parentProductGroupId == null) q = q.is('parent_product_group_id', null);
  else q = q.eq('parent_product_group_id', parentProductGroupId);
  const { data: existing, error: e1 } = await q.limit(1).maybeSingle();
  if (e1) throw e1;
  if (existing) return { id: existing.id, created: false };
  const { data: ins, error: e2 } = await supabase
    .from('product_groups')
    .insert({ tenant_id: tenantId, name, parent_product_group_id: parentProductGroupId })
    .select('id')
    .single();
  if (e2) throw e2;
  return { id: ins.id, created: true };
}

async function ensureProduct(supabase, tenantId, name, product_group_id, row) {
  const chargeable =
    row.chargeable_bag_size != null && row.chargeable_bag_size !== ''
      ? num(row.chargeable_bag_size)
      : null;
  const monthly = row.monthly_rent_per_kg != null ? num(row.monthly_rent_per_kg) : null;
  const yearly = row.yearly_rent_per_kg != null ? num(row.yearly_rent_per_kg) : null;

  const { data: existing, error: e1 } = await supabase
    .from('products')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('product_name', name)
    .limit(1)
    .maybeSingle();
  if (e1) throw e1;
  if (existing) {
    const { error: up } = await supabase
      .from('products')
      .update({
        product_group_id,
        chargeable_bag_size: chargeable,
        monthly_rent_per_kg: monthly,
        yearly_rent_per_kg: yearly,
      })
      .eq('id', existing.id);
    if (up) throw up;
    return { id: existing.id, created: false };
  }
  const { data: ins, error: e2 } = await supabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      product_name: name,
      product_group_id,
      chargeable_bag_size: chargeable,
      monthly_rent_per_kg: monthly,
      yearly_rent_per_kg: yearly,
      is_active: true,
    })
    .select('id')
    .single();
  if (e2) throw e2;
  return { id: ins.id, created: true };
}

async function upsertProductCharge(supabase, productId, chargeTypeId, chargesPerBag) {
  const { error } = await supabase.from('product_charges').upsert(
    {
      product_id: productId,
      charge_type_id: chargeTypeId,
      charges_per_bag: chargesPerBag,
    },
    { onConflict: 'product_id,charge_type_id' },
  );
  if (error) throw error;
}

function productChargeKey(productId, code) {
  return `${productId}|${code}`;
}

/**
 * Load tenant/warehouse-scoped maps and preloads for the lots import loop.
 * One code path for full and IMPORT_LOTS_ONLY runs.
 */
async function buildLotsImportContext(supabase, tenantId, warehouseId) {
  const productRows = await fetchAllPaged(() =>
    supabase.from('products').select('id, product_name').eq('tenant_id', tenantId),
  );
  const productNameToId = new Map(
    productRows.map((r) => [r.product_name, r.id]),
  );
  const productIdSet = new Set(productRows.map((r) => r.id));

  const customerRows = await fetchAllPaged(() =>
    supabase
      .from('customers')
      .select('id, customer_code, customer_name')
      .eq('warehouse_id', warehouseId),
  );
  const customerKeyToId = new Map(
    customerRows.map((r) => [customerKey(r.customer_code, r.customer_name), r.id]),
  );

  const locRows = await fetchAllPaged(() =>
    supabase.from('locations').select('id, name').eq('warehouse_id', warehouseId),
  );
  const locationNameToId = new Map(locRows.map((r) => [r.name, r.id]));

  const lotRows = await fetchAllPaged(() =>
    supabase
      .from('lots')
      .select('id, lot_number, product_id, balance_bags')
      .eq('warehouse_id', warehouseId),
  );
  const lotIdByKey = new Map();
  const lotIdToProductId = new Map();
  for (const r of lotRows) {
    lotIdByKey.set(lotKey(warehouseId, r.lot_number), r.id);
    lotIdToProductId.set(r.id, r.product_id);
  }
  const lotUuids = lotRows.map((r) => r.id);

  const { data: cts, error: ctsE } = await supabase
    .from('charge_types')
    .select('id, code')
    .eq('tenant_id', tenantId);
  if (ctsE) throw ctsE;
  const chargeIdToCode = new Map((cts ?? []).map((x) => [x.id, x.code]));
  const needForLots = ['HAMALI', 'KATA_COOLIE', 'MAMULLE', 'PLATFORM_HAMALI'];
  const codesHave = new Set((cts ?? []).map((c) => c.code));
  for (const c of needForLots) {
    if (!codesHave.has(c)) {
      throw new Error(
        `Missing charge_types for code ${c} (tenant). Run migrations / seed charge_types.`,
      );
    }
  }

  const productChargeIdByKey = new Map();
  for (const chunk of chunkArray([...productIdSet], 100)) {
    if (!chunk.length) break;
    const { data: pcs, error: pe } = await supabase
      .from('product_charges')
      .select('product_charge_type_id, product_id, charge_type_id')
      .in('product_id', chunk);
    if (pe) throw pe;
    for (const r of pcs ?? []) {
      const code = chargeIdToCode.get(r.charge_type_id);
      if (code) {
        productChargeIdByKey.set(
          productChargeKey(r.product_id, code),
          r.product_charge_type_id,
        );
      }
    }
  }

  const lodgementBatchesPresent = new Set();
  for (const chunk of chunkArray(lotUuids, IN_CHUNK)) {
    if (!chunk.length) break;
    const { data: tcs, error: te } = await supabase
      .from('transaction_charges')
      .select('lot_id, charge_date')
      .in('lot_id', chunk)
      .is('delivery_id', null);
    if (te) throw te;
    for (const row of tcs ?? []) {
      if (row.charge_date) {
        const d = String(row.charge_date).slice(0, 10);
        lodgementBatchesPresent.add(`${row.lot_id}|${d}`);
      }
    }
  }

  const deliveryIdsWithCharges = new Set();
  for (const chunk of chunkArray(lotUuids, IN_CHUNK)) {
    if (!chunk.length) break;
    const { data: tcs, error: te2 } = await supabase
      .from('transaction_charges')
      .select('delivery_id')
      .in('lot_id', chunk)
      .not('delivery_id', 'is', null);
    if (te2) throw te2;
    for (const row of tcs ?? []) {
      if (row.delivery_id) deliveryIdsWithCharges.add(row.delivery_id);
    }
  }

  const deliveryByLotExtRef = new Map();
  const deliveryByLotDateBags = new Map();
  let deliveryRowCount = 0;
  for (const chunk of chunkArray(lotUuids, IN_CHUNK)) {
    if (!chunk.length) break;
    const { data: dels, error: de } = await supabase
      .from('deliveries')
      .select('id, lot_id, num_bags_out, delivery_date, external_reference_id')
      .in('lot_id', chunk);
    if (de) throw de;
    for (const d of dels ?? []) {
      deliveryRowCount += 1;
      const drow = { id: d.id, num_bags_out: d.num_bags_out };
      if (d.external_reference_id && String(d.external_reference_id).trim() !== '') {
        const eref = String(d.external_reference_id).trim();
        deliveryByLotExtRef.set(`${d.lot_id}\0${eref}`, drow);
      }
      const dStr = d.delivery_date ? String(d.delivery_date).slice(0, 10) : '';
      deliveryByLotDateBags.set(`${d.lot_id}\0${dStr}\0${d.num_bags_out}`, drow);
    }
  }

  log('buildLotsImportContext (from DB)', {
    products: productNameToId.size,
    customers: customerKeyToId.size,
    locations: locationNameToId.size,
    lots: lotIdByKey.size,
    productChargeKeys: productChargeIdByKey.size,
    lodgementBatchKeys: lodgementBatchesPresent.size,
    deliveryIdsWithCharges: deliveryIdsWithCharges.size,
    deliveryRows: deliveryRowCount,
  });

  return {
    productNameToId,
    customerKeyToId,
    locationNameToId,
    lotIdByKey,
    lotIdToProductId,
    productChargeIdByKey,
    lodgementBatchesPresent,
    deliveryIdsWithCharges,
    deliveryByLotExtRef,
    deliveryByLotDateBags,
  };
}

async function main() {
  if (DRY_RUN) {
    const productGroups = readCsv('product_groups.csv');
    const productsCsv = readCsv('products.csv');
    const locCsv = readCsv('locations.csv');
    const customersCsv = readCsv('customers.csv');
    const ld = readCsv('lots-and-deliveries.csv');
    console.log('DRY_RUN: CSV row counts (no database calls)');
    console.log({
      IMPORT_LOTS_ONLY,
      product_groups: productGroups.length,
      products: productsCsv.length,
      locations: locCsv.length,
      customers: customersCsv.length,
      lots_and_deliveries: ld.length,
    });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  let tenantId;
  const { data: existingTenant, error: tErr } = await supabase
    .from('tenants')
    .select('id')
    .eq('name', TENANT_NAME)
    .maybeSingle();
  if (tErr) throw tErr;
  if (existingTenant) {
    tenantId = existingTenant.id;
    log(`Tenant "${TENANT_NAME}" found`, { tenantId });
  } else {
    const { data: t, error } = await supabase
      .from('tenants')
      .insert({ name: TENANT_NAME })
      .select('id')
      .single();
    if (error) throw error;
    tenantId = t.id;
    log(`Tenant "${TENANT_NAME}" created`, { tenantId });
  }

  let warehouseId;
  const { data: whRow, error: wErr } = await supabase
    .from('warehouses')
    .select('id')
    .eq('tenant_id', tenantId)
    .ilike('warehouse_name', `%${WAREHOUSE_NAME}%`)
    .maybeSingle();
  if (wErr) throw wErr;
  if (whRow) {
    warehouseId = whRow.id;
    log(`Warehouse "${WAREHOUSE_NAME}" found`, { warehouseId });
  } else {
    const { data: w, error } = await supabase
      .from('warehouses')
      .insert({
        tenant_id: tenantId,
        warehouse_name: WAREHOUSE_NAME,
        warehouse_code: WAREHOUSE_CODE,
        city: 'Padala',
        state: 'Andhra Pradesh',
        pincode: null,
        capacity_bags: 100000,
      })
      .select('id')
      .single();
    if (error) throw error;
    warehouseId = w.id;
    log(`Warehouse "${WAREHOUSE_NAME}" created`, { warehouseId });
  }

  if (!IMPORT_LOTS_ONLY) {
  const { data: existingWs } = await supabase
    .from('warehouse_settings')
    .select('id')
    .eq('warehouse_id', warehouseId)
    .maybeSingle();
  if (!existingWs) {
    const { error: wsErr } = await supabase.from('warehouse_settings').insert({
      warehouse_id: warehouseId,
      tenant_id: tenantId,
      blanket_stale_days: 180,
      follow_up_outstanding_days: 30,
      yearly_rent_cutoff_date: '2026-01-01',
      grace_period_months: 1,
    });
    if (wsErr) throw wsErr;
    log('warehouse_settings row created');
  } else {
    log('warehouse_settings already present; skipped insert');
  }

  const { data: chargeTypeRows, error: cte } = await supabase
    .from('charge_types')
    .select('id, code')
    .eq('tenant_id', tenantId);
  if (cte) throw cte;
  const chargeTypeByCode = new Map((chargeTypeRows ?? []).map((r) => [r.code, r.id]));
  const needCodes = ['HAMALI', 'KATA_COOLIE', 'MAMULLE', 'PLATFORM_HAMALI', 'TRANSPORT', 'INSURANCE'];
  for (const c of needCodes) {
    if (!chargeTypeByCode.has(c)) {
      throw new Error(`Missing charge_types row for code ${c} (tenant). Run migrations.`);
    }
  }
  log('charge_types verified for tenant', { codes: needCodes.length });

  log('Loading product_groups.csv …');
  const productGroups = readCsv('product_groups.csv');
  const groupNameToId = new Map();
  let groupsCreated = 0;
  let groupsReused = 0;

  const pending = new Set(productGroups.map((r) => r.product_group?.trim()).filter(Boolean));
  const byName = new Map();
  for (const r of productGroups) {
    byName.set(r.product_group.trim(), (r.parent_product_group || '').trim() || null);
  }
  for (const name of [...pending]) {
    const par = byName.get(name);
    if (!par) {
      const { id, created } = await ensureProductGroup(supabase, tenantId, name, null);
      groupNameToId.set(name, id);
      pending.delete(name);
      if (created) groupsCreated += 1;
      else groupsReused += 1;
    }
  }
  let guard = 0;
  while (pending.size && guard++ < 200) {
    for (const name of [...pending]) {
      const pName = byName.get(name);
      if (!pName) continue;
      const pid = groupNameToId.get(pName);
      if (!pid) continue;
      const { id, created } = await ensureProductGroup(supabase, tenantId, name, pid);
      groupNameToId.set(name, id);
      pending.delete(name);
      if (created) groupsCreated += 1;
      else groupsReused += 1;
    }
  }
  if (pending.size) {
    throw new Error(`Could not resolve product groups (cycle or missing parent): ${[...pending].join(', ')}`);
  }
  log('product_groups.csv loaded', {
    rows: productGroups.length,
    created: groupsCreated,
    reused: groupsReused,
    mapSize: groupNameToId.size,
  });

  log('Loading products.csv (products + product_charges) …');
  const productsCsv = readCsv('products.csv');
  const productNameToId = new Map();
  let productsCreated = 0;
  let productsReused = 0;

  for (const p of productsCsv) {
    const name = p.name?.trim();
    const pg = p.product_group?.trim();
    if (!name || !pg) continue;
    const product_group_id = groupNameToId.get(pg);
    if (!product_group_id) {
      throw new Error(`product_group not found: ${pg} for product ${name}`);
    }
    const { id, created } = await ensureProduct(supabase, tenantId, name, product_group_id, p);
    productNameToId.set(name, id);
    if (created) productsCreated += 1;
    else productsReused += 1;

    const rates = [
      ['HAMALI', p.hamali_per_bag],
      ['KATA_COOLIE', p.kata_coolie_per_bag],
      ['MAMULLE', p.mamullu_per_bag],
      ['PLATFORM_HAMALI', p.platform_coolie_per_bag],
    ];
    if (num(p.insurance_per_bag) > 0) {
      rates.push(['INSURANCE', p.insurance_per_bag]);
    }
    for (const [code, val] of rates) {
      if (val == null || val === '') continue;
      const ct = chargeTypeByCode.get(code);
      if (!ct) throw new Error(`code ${code}`);
      await upsertProductCharge(supabase, id, ct, num(val));
    }
  }
  log('products.csv + product_charges loaded', {
    rows: productsCsv.length,
    productsCreated,
    productsReused,
    catalogProductIds: productNameToId.size,
  });

  log('Loading locations.csv …');
  const locCsv = readCsv('locations.csv');
  const locationNameToId = new Map();
  let locInserted = 0;
  let locReused = 0;
  for (const r of locCsv) {
    const n = r.location_name?.trim();
    if (!n) continue;
    const { data: loc, error } = await supabase
      .from('locations')
      .insert({ tenant_id: tenantId, warehouse_id: warehouseId, name: n })
      .select('id')
      .single();
    if (error) {
      if (error.code === '23505') {
        const { data: ex } = await supabase
          .from('locations')
          .select('id')
          .eq('warehouse_id', warehouseId)
          .eq('name', n)
          .single();
        if (ex) {
          locationNameToId.set(n, ex.id);
          locReused += 1;
        }
      } else throw error;
    } else {
      locationNameToId.set(n, loc.id);
      locInserted += 1;
    }
  }
  log('locations.csv loaded', {
    rows: locCsv.length,
    inserted: locInserted,
    reusedConflict: locReused,
    mapSize: locationNameToId.size,
  });

  log('Loading customers.csv …');
  const customersCsv = readCsv('customers.csv');
  const customerKeyToId = new Map();
  let custInserted = 0;
  let custReused = 0;
  for (const r of customersCsv) {
    const code = (r.cusotmer_code ?? r.customer_code ?? '').trim();
    const customer_name = (r.customer_name || '').trim();
    if (!code || !customer_name) continue;
    const phone = r.phone?.trim() || null;
    const category = (r.category || 'Farmer').toUpperCase() === 'TRADER' ? 'TRADER' : 'FARMER';
    const { data: c, error } = await supabase
      .from('customers')
      .insert({
        warehouse_id: warehouseId,
        tenant_id: tenantId,
        customer_code: code,
        customer_name,
        phone,
        mobile: r.mobile?.trim() || null,
        address: r.address?.trim() || null,
        category,
        credit_limit: 0,
        is_active: true,
      })
      .select('id')
      .single();
    if (error) {
      if (error.code === '23505') {
        const { data: ex } = await supabase
          .from('customers')
          .select('id')
          .eq('warehouse_id', warehouseId)
          .eq('customer_code', code)
          .eq('customer_name', customer_name)
          .single();
        if (ex) {
          customerKeyToId.set(customerKey(code, customer_name), ex.id);
          custReused += 1;
        }
      } else {
        throw error;
      }
    } else {
      customerKeyToId.set(customerKey(code, customer_name), c.id);
      custInserted += 1;
    }
  }
  log('customers.csv loaded', {
    rows: customersCsv.length,
    inserted: custInserted,
    reusedConflict: custReused,
    mapSize: customerKeyToId.size,
  });
  } else {
    log('IMPORT_LOTS_ONLY: skipping product_groups, products, locations, customers (using DB for lots phase)');
  }

  const {
    productNameToId,
    customerKeyToId,
    locationNameToId,
    lotIdByKey: lotIdByKeyInit,
    lotIdToProductId,
    productChargeIdByKey,
    lodgementBatchesPresent,
    deliveryIdsWithCharges,
    deliveryByLotExtRef,
    deliveryByLotDateBags,
  } = await buildLotsImportContext(supabase, tenantId, warehouseId);

  const lotIdByKey = new Map(lotIdByKeyInit);

  log('Loading lots-and-deliveries.csv …');
  const ld = readCsv('lots-and-deliveries.csv');
  ld.sort((a, b) => {
    const da = parseUsDate(a.transaction_date);
    const db = parseUsDate(b.transaction_date);
    return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
  });
  log('lots-and-deliveries.csv loaded and sorted', { rows: ld.length });

  log('Processing IN/OUT rows (repeat-run-safe: reuse lots/deliveries; skip duplicate charge batches) …');
  const chargeSpec = [
    { paid: 'hamali_charges_paid', recv: 'hamali_charges_receivable', code: 'HAMALI' },
    { paid: 'kata_coolie_charges_paid', recv: 'kata_coolie_charges_receivable', code: 'KATA_COOLIE' },
    { paid: 'mamullu_charges_paid', recv: 'mamullu_charges_receivable', code: 'MAMULLE' },
    { paid: 'platform_hamali_charges_paid', recv: 'platform_hamali_charges_receivable', code: 'PLATFORM_HAMALI' },
  ];

  let inLotsInserted = 0;
  let inLotsReused = 0;
  let inChargesInserted = 0;
  let inChargesSkipped = 0;
  let outDelInserted = 0;
  let outDelReused = 0;
  let outChargesInserted = 0;
  let outChargesSkipped = 0;
  const progressEvery = 500;

  for (let i = 0; i < ld.length; i++) {
    const r = ld[i];
    if (i > 0 && i % progressEvery === 0) {
      log(`lots/deliveries progress ${i}/${ld.length}`);
    }
    const txd = parseUsDate(r.transaction_date);
    const txIso = toIsoDate(txd);
    if (!txIso) {
      throw new Error(`bad transaction_date: ${r.transaction_date}`);
    }
    const mode = (r.transfer_mode || '').toUpperCase();
    const ccode = (r.customer_code || r.cusotmer_code || '').trim();
    const cname = (r.customer_name || '').trim();
    const customer_id = customerKeyToId.get(customerKey(ccode, cname));
    if (!customer_id) {
      throw new Error(`Unknown customer: ${ccode} / ${cname}`);
    }
    const product_name = (r.product_name || '').trim();
    const product_id = productNameToId.get(product_name);
    if (!product_id) {
      throw new Error(`Unknown product: ${product_name}`);
    }
    const lotNum = (r.lot_number || '').trim();
    const bags = Math.max(0, Math.floor(num(r.num_bags)));

    if (mode === 'IN') {
      const lotLegacy = (r.lots_legacy_locations && r.lots_legacy_locations !== '0' ? r.lots_legacy_locations : null) || null;
      const locNames = splitLocationNames(lotLegacy);
      const locIds = locNames.map((n) => locationNameToId.get(n)).filter(Boolean);
      const lk = lotKey(warehouseId, lotNum);
      const existingLotId = lotIdByKey.get(lk);
      let lotRowId;
      let lotWasNew = false;
      if (existingLotId) {
        lotRowId = existingLotId;
        inLotsReused += 1;
      } else {
        const { data: lotRow, error: le } = await supabase
          .from('lots')
          .insert({
            warehouse_id: warehouseId,
            tenant_id: tenantId,
            customer_id,
            product_id,
            lot_number: lotNum,
            original_bags: bags,
            balance_bags: bags,
            lodgement_date: txIso,
            rental_mode: rentalModeFromDate(txd),
            location_ids: locIds,
            legacy_locations: lotLegacy,
            driver_name: r.driver_name?.trim() || null,
            vehicle_number: r.vehicle_number?.trim() || null,
            notes: r.notes?.trim() || null,
            external_reference_id: r.external_reference_id != null ? String(r.external_reference_id) : null,
            status: 'ACTIVE',
          })
          .select('id')
          .single();
        if (le) throw le;
        lotRowId = lotRow.id;
        lotWasNew = true;
        inLotsInserted += 1;
        lotIdByKey.set(lk, lotRowId);
        lotIdToProductId.set(lotRowId, product_id);
      }

      const lodgementKey = `${lotRowId}|${txIso}`;
      if (!lotWasNew && lodgementBatchesPresent.has(lodgementKey)) {
        inChargesSkipped += 1;
        continue;
      }

      const rows = [];
      for (const spec of chargeSpec) {
        const paid = num(r[spec.paid]);
        const recv = num(r[spec.recv]);
        if (recv === 0 && paid === 0) continue;
        const pctype = productChargeIdByKey.get(productChargeKey(product_id, spec.code));
        if (!pctype) throw new Error(`product_charge for ${product_name} + ${spec.code}`);
        const isPaid = recv > 0 && Math.abs(recv - paid) < 0.01;
        rows.push({
          lot_id: lotRowId,
          delivery_id: null,
          product_charge_type_id: pctype,
          charge_amount: recv,
          legacy_amount_paid: paid,
          num_bags: bags,
          charge_date: txIso,
          is_paid: isPaid,
          paid_date: isPaid ? txIso : null,
        });
      }
      if (rows.length) {
        const { error: tce } = await supabase.from('transaction_charges').insert(rows);
        if (tce) throw tce;
        inChargesInserted += 1;
        lodgementBatchesPresent.add(lodgementKey);
      }
    } else if (mode === 'OUT') {
      const lkey = lotKey(warehouseId, lotNum);
      let lot_id = lotIdByKey.get(lkey);
      let lotProductId = product_id;
      if (!lot_id) {
        const { data: lfetch, error: fe } = await supabase
          .from('lots')
          .select('id, balance_bags, product_id')
          .eq('warehouse_id', warehouseId)
          .eq('lot_number', lotNum)
          .maybeSingle();
        if (fe) throw fe;
        if (!lfetch) throw new Error(`OUT row: lot not found ${lotNum}`);
        lot_id = lfetch.id;
        lotProductId = lfetch.product_id;
        lotIdByKey.set(lkey, lot_id);
        lotIdToProductId.set(lot_id, lfetch.product_id);
      } else {
        const lpId = lotIdToProductId.get(lot_id);
        if (lpId) lotProductId = lpId;
      }

      const delLegacy = (r.deliveries_legacy_locations && r.deliveries_legacy_locations !== '0'
        ? r.deliveries_legacy_locations
        : null) || null;
      const locNames = splitLocationNames(delLegacy);
      const locIds = locNames.map((n) => locationNameToId.get(n)).filter(Boolean);

      const extRef = r.external_reference_id != null && String(r.external_reference_id).trim() !== ''
        ? String(r.external_reference_id).trim()
        : null;
      const numOut = Math.max(1, bags || 1);

      let dRow = null;
      let deliveryWasNew = false;

      if (extRef) {
        dRow = deliveryByLotExtRef.get(`${lot_id}\0${extRef}`) ?? null;
        if (dRow) outDelReused += 1;
      } else {
        dRow = deliveryByLotDateBags.get(`${lot_id}\0${txIso}\0${numOut}`) ?? null;
        if (dRow) outDelReused += 1;
      }

      if (!dRow) {
        const { data: insDel, error: de } = await supabase
          .from('deliveries')
          .insert({
            lot_id,
            num_bags_out: numOut,
            delivery_date: txIso,
            status: 'DELIVERED',
            driver_name: r.driver_name?.trim() || null,
            vehicle_number: r.vehicle_number?.trim() || null,
            notes: r.notes?.trim() || null,
            legacy_locations: delLegacy,
            location_ids: locIds,
            external_reference_id: extRef,
          })
          .select('id, num_bags_out')
          .single();
        if (de) throw de;
        dRow = insDel;
        deliveryWasNew = true;
        outDelInserted += 1;
        if (extRef) {
          deliveryByLotExtRef.set(`${lot_id}\0${extRef}`, dRow);
        } else {
          deliveryByLotDateBags.set(`${lot_id}\0${txIso}\0${numOut}`, dRow);
        }

        const { data: before } = await supabase.from('lots').select('balance_bags').eq('id', lot_id).single();
        const nextBal = Math.max(0, (before?.balance_bags ?? 0) - dRow.num_bags_out);
        const { error: ue } = await supabase.from('lots').update({ balance_bags: nextBal }).eq('id', lot_id);
        if (ue) throw ue;
      }

      if (!deliveryWasNew && deliveryIdsWithCharges.has(dRow.id)) {
        outChargesSkipped += 1;
        continue;
      }

      const rows = [];
      for (const spec of chargeSpec) {
        const paid = num(r[spec.paid]);
        const recv = num(r[spec.recv]);
        if (recv === 0 && paid === 0) continue;
        const pctype = productChargeIdByKey.get(productChargeKey(lotProductId, spec.code));
        if (!pctype) throw new Error(`product_charge for lot product + ${spec.code}`);
        const isPaid = recv > 0 && Math.abs(recv - paid) < 0.01;
        rows.push({
          lot_id,
          delivery_id: dRow.id,
          product_charge_type_id: pctype,
          charge_amount: recv,
          legacy_amount_paid: paid,
          num_bags: bags,
          charge_date: txIso,
          is_paid: isPaid,
          paid_date: isPaid ? txIso : null,
        });
      }
      if (rows.length) {
        const { error: tce } = await supabase.from('transaction_charges').insert(rows);
        if (tce) throw tce;
        outChargesInserted += 1;
        deliveryIdsWithCharges.add(dRow.id);
      }
    } else {
      throw new Error(`Unknown transfer_mode: ${r.transfer_mode}`);
    }
  }

  log('lots-and-deliveries.csv finished', {
    rows: ld.length,
    inLotsInserted,
    inLotsReused,
    inChargeBatchesInserted: inChargesInserted,
    inChargeRowsSkippedDuplicate: inChargesSkipped,
    outDeliveriesInserted: outDelInserted,
    outDeliveriesReused: outDelReused,
    outChargeBatchesInserted: outChargesInserted,
    outChargeRowsSkippedDuplicate: outChargesSkipped,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
