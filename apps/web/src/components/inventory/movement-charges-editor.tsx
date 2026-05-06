'use client';

import { Lock } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatINR } from '@growcold/shared';
import type { ChargesBootstrapResponse } from '@/lib/charges-api-schemas';
import type { RowDraft } from '@/lib/movement-charges-draft';
import { round2 } from '@/lib/movement-charges-draft';
import { cn } from '@/lib/utils';

type ChargesData = ChargesBootstrapResponse['data'];
type ChargeRow = ChargesData['charge_rows'][number];

function rowArrowColor(diff: number): string {
  return diff >= 0 ? 'text-inward' : 'text-outward';
}

interface MovementChargesEditorProps {
  bagsMax: number;
  data: Pick<ChargesData, 'charge_rows'>;
  draft: Record<string, RowDraft>;
  setRow: (pctId: string, patch: Partial<RowDraft>) => void;
}

export function MovementChargesEditor({ bagsMax, data, draft, setRow }: MovementChargesEditorProps) {
  const { t } = useTranslation('charges');

  function recomputeRecv(pctId: string, tpl: ChargeRow, nextBags?: number) {
    const cur = draft[pctId];
    if (!cur || tpl.is_transport || cur.recvManual) return;
    const rate = tpl.rate_per_bag ?? 0;
    const b = nextBags ?? cur.bags;
    setRow(pctId, { recv: round2(b * (rate || 0)) });
  }

  function onBagsChange(pctId: string, tpl: ChargeRow, raw: string) {
    const parsed = Number.parseInt(raw, 10);
    let bagsError: string | undefined;
    let bagsNum = Number.isFinite(parsed) && !Number.isNaN(parsed) ? Math.max(0, parsed) : 0;
    if (!Number.isFinite(parsed)) bagsError = t('bags_error_negative');
    if (bagsNum > bagsMax) {
      bagsError = t('bags_error_max');
      bagsNum = bagsMax;
    }
    setRow(pctId, { bags: bagsNum, bagsError });
    recomputeRecv(pctId, tpl, bagsNum);
  }

  function toggleRecvManual(pctId: string, tpl: ChargeRow) {
    const cur = draft[pctId];
    if (!cur || tpl.is_transport) return;
    const nextManual = !cur.recvManual;
    if (!nextManual) {
      const rate = tpl.rate_per_bag ?? 0;
      const recv = round2(cur.bags * (rate || 0));
      setRow(pctId, { recvManual: false, recv });
    } else setRow(pctId, { recvManual: true });
  }

  function onPaidBlur(pctId: string, tpl: ChargeRow, raw: string) {
    const paidN = Number.parseFloat(raw);
    const p = Number.isFinite(paidN) ? round2(Math.max(0, paidN)) : 0;
    const patch: Partial<RowDraft> = { paid: p, methodError: undefined };
    if (p > 0 && tpl.has_labor && !draft[pctId]?.method) patch.method = 'CASH';
    if (p <= 0) {
      patch.method = '';
      patch.methodError = undefined;
    }
    setRow(pctId, patch);
  }

  const totals = useMemo(() => {
    let recv = 0;
    let paid = 0;
    for (const row of data.charge_rows) {
      const dr = draft[row.product_charge_type_id];
      if (!dr) continue;
      recv += dr.recv;
      if (row.has_labor) paid += dr.paid;
    }
    return { recv: round2(recv), paid: round2(paid) };
  }, [data, draft]);

  const net = round2(totals.recv - totals.paid);

  function renderRecvControl(row: ChargeRow, dr: RowDraft) {
    if (dr.recvManual && !row.is_transport) {
      return (
        <div className="flex flex-col gap-2">
          <span className="text-caption text-text-secondary">{t('manual_receive')}</span>
          <input
            type="number"
            inputMode="decimal"
            className="input-base"
            value={dr.recv || ''}
            onChange={(e) =>
              setRow(row.product_charge_type_id, {
                recv: round2(Math.max(0, Number(e.target.value) || 0)),
              })
            }
            onBlur={(e) =>
              setRow(row.product_charge_type_id, {
                recv: round2(Math.max(0, Number.parseFloat(e.target.value) || 0)),
              })
            }
          />
          <button
            type="button"
            className="text-left text-caption text-brand-text underline"
            onClick={() => toggleRecvManual(row.product_charge_type_id, row)}
          >
            {t('revert_calc')}
          </button>
        </div>
      );
    }
    if (row.is_transport) {
      return (
        <input
          type="number"
          inputMode="decimal"
          className="input-base"
          value={dr.recv === 0 ? '' : dr.recv}
          onChange={(e) =>
            setRow(row.product_charge_type_id, { recv: round2(Number(e.target.value) || 0) })
          }
          onBlur={(e) =>
            setRow(row.product_charge_type_id, {
              recv: round2(Math.max(0, Number.parseFloat(e.target.value) || 0)),
            })
          }
        />
      );
    }
    return (
      <button
        type="button"
        className="input-base inline-flex cursor-pointer items-center justify-between gap-2 bg-surface-subtle"
        onClick={() => toggleRecvManual(row.product_charge_type_id, row)}
      >
        <span>{formatINR(dr.recv)}</span>
        <Lock className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
      </button>
    );
  }

  function renderLaborControls(row: ChargeRow, dr: RowDraft) {
    if (!row.has_labor) return null;
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="form-field gap-1">
          <span className="text-label">{t('paid_label')}</span>
          <input
            type="number"
            inputMode="decimal"
            className="input-base"
            value={dr.paid === 0 ? '' : dr.paid}
            onChange={(e) =>
              setRow(row.product_charge_type_id, { paid: Number(e.target.value) || 0 })
            }
            onBlur={(e) => onPaidBlur(row.product_charge_type_id, row, e.target.value)}
          />
        </label>
        <label className={cn('form-field gap-1', dr.paid <= 0 && 'opacity-40')}>
          <span className="text-label">{t('method_label')}</span>
          <select
            className={cn('input-base', dr.methodError && 'border-outward-border')}
            disabled={dr.paid <= 0}
            value={dr.method}
            onChange={(e) =>
              setRow(row.product_charge_type_id, {
                method: e.target.value as RowDraft['method'],
                methodError: undefined,
              })
            }
          >
            <option value="">—</option>
            <option value="CASH">{t('method_cash')}</option>
            <option value="UPI">{t('method_upi')}</option>
            <option value="OTHER">{t('method_other')}</option>
          </select>
          {dr.methodError ? <span className="error-text">{dr.methodError}</span> : null}
        </label>
      </div>
    );
  }

  function diffFor(dr: RowDraft, hasLabor: boolean) {
    return round2(dr.recv - (hasLabor ? dr.paid : 0));
  }

  return (
    <>
      <div className="flex flex-col gap-3 md:hidden">
        {data.charge_rows.map((row) => {
          const dr = draft[row.product_charge_type_id];
          if (!dr) return null;
          const d = diffFor(dr, row.has_labor);
          return (
            <div key={row.product_charge_type_id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-text-primary">{row.display_name}</span>
                <span className="text-caption text-text-tertiary">
                  {row.is_transport
                    ? t('transport_dash')
                    : row.rate_per_bag != null
                      ? `${formatINR(row.rate_per_bag)} ${t('rate_suffix')}`
                      : '—'}
                </span>
              </div>
              {!row.is_transport ? (
                <label className="form-field gap-1">
                  <span className="text-label">{t('bags_label')}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={cn('input-base', dr.bagsError && 'border-outward-border')}
                    value={dr.bags}
                    onChange={(e) => onBagsChange(row.product_charge_type_id, row, e.target.value)}
                    onBlur={() => setRow(row.product_charge_type_id, { bagsError: undefined })}
                  />
                  {dr.bagsError ? <span className="error-text">{dr.bagsError}</span> : null}
                </label>
              ) : null}
              <div className="flex flex-col gap-1">
                <span className="text-label">{t('receivable_label')}</span>
                {renderRecvControl(row, dr)}
              </div>
              {renderLaborControls(row, dr)}
              <div className={cn('flex justify-end text-sm font-semibold', rowArrowColor(d))}>
                {t('diff_label')}: {formatINR(Math.abs(d))} {d >= 0 ? '↑' : '↓'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] border-collapse text-body-sm">
          <thead className="border-b border-border bg-surface-subtle text-left">
            <tr className="text-caption font-medium uppercase text-text-secondary">
              <th className="px-2 py-2">{t('charge_col')}</th>
              <th className="px-2 py-2">{t('bags_col')}</th>
              <th className="px-2 py-2">{t('rate_col')}</th>
              <th className="px-2 py-2">{t('receivable_col')}</th>
              <th className="px-2 py-2">{t('paid_col')}</th>
              <th className="px-2 py-2">{t('method_col')}</th>
              <th className="px-2 py-2">{t('diff_col')}</th>
            </tr>
          </thead>
          <tbody>
            {data.charge_rows.map((row) => {
              const dr = draft[row.product_charge_type_id];
              if (!dr) return null;
              const d = diffFor(dr, row.has_labor);
              return (
                <tr key={row.product_charge_type_id} className="border-b border-border align-top">
                  <td className="px-2 py-2 font-medium">{row.display_name}</td>
                  <td className="px-2 py-2">
                    {!row.is_transport ? (
                      <>
                        <input
                          type="number"
                          inputMode="numeric"
                          className={cn('input-base max-w-[5rem]', dr.bagsError && 'border-outward-border')}
                          value={dr.bags}
                          onChange={(e) => onBagsChange(row.product_charge_type_id, row, e.target.value)}
                          onBlur={() => setRow(row.product_charge_type_id, { bagsError: undefined })}
                        />
                        {dr.bagsError ? <p className="error-text">{dr.bagsError}</p> : null}
                      </>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {!row.is_transport && row.rate_per_bag != null
                      ? `${formatINR(row.rate_per_bag)} ${t('rate_suffix')}`
                      : '—'}
                  </td>
                  <td className="px-2 py-2">{renderRecvControl(row, dr)}</td>
                  <td className="px-2 py-2">
                    {!row.has_labor ? (
                      '—'
                    ) : (
                      <input
                        type="number"
                        inputMode="decimal"
                        className="input-base max-w-[7rem]"
                        value={dr.paid === 0 ? '' : dr.paid}
                        onChange={(e) =>
                          setRow(row.product_charge_type_id, { paid: Number(e.target.value) || 0 })
                        }
                        onBlur={(e) => onPaidBlur(row.product_charge_type_id, row, e.target.value)}
                      />
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {!row.has_labor ? (
                      '—'
                    ) : (
                      <select
                        className={cn('input-base max-w-[7rem]', dr.methodError && 'border-outward-border')}
                        disabled={dr.paid <= 0}
                        value={dr.method}
                        onChange={(e) =>
                          setRow(row.product_charge_type_id, {
                            method: e.target.value as RowDraft['method'],
                            methodError: undefined,
                          })
                        }
                      >
                        <option value="">—</option>
                        <option value="CASH">{t('method_cash')}</option>
                        <option value="UPI">{t('method_upi')}</option>
                        <option value="OTHER">{t('method_other')}</option>
                      </select>
                    )}
                    {dr.methodError ? <p className="error-text">{dr.methodError}</p> : null}
                  </td>
                  <td className={cn('px-2 py-2 font-medium', rowArrowColor(d))}>
                    {formatINR(Math.abs(d))} {d >= 0 ? '↑' : '↓'}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-surface-subtle font-semibold">
              <td className="px-2 py-2" colSpan={3}>
                {t('total_row')}
              </td>
              <td className="px-2 py-2">{formatINR(totals.recv)}</td>
              <td className="px-2 py-2">{formatINR(totals.paid)}</td>
              <td className="px-2 py-2" />
              <td className={cn('px-2 py-2', net >= 0 ? 'text-inward' : 'text-outward')}>
                {formatINR(Math.abs(net))} {net >= 0 ? '↑' : '↓'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card flex flex-col gap-2 md:hidden">
        <div className="flex justify-between border-b border-border pb-2">
          <span>{t('total_receivable')}</span>
          <span>{formatINR(totals.recv)}</span>
        </div>
        <div className="flex justify-between border-b border-border pb-2">
          <span>{t('total_paid')}</span>
          <span>{formatINR(totals.paid)}</span>
        </div>
        <div
          className={cn(
            'flex justify-between font-semibold',
            net >= 0 ? 'text-inward' : 'text-outward',
          )}
        >
          <span>{t('net_label')}</span>
          <span>
            {formatINR(Math.abs(net))} {net >= 0 ? '↑' : '↓'}
          </span>
        </div>
      </div>
    </>
  );
}
