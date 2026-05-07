'use client';

import { Package, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GlobalSearchLot, GlobalSearchParty } from '@/lib/use-global-search-query';
import { cn } from '@/lib/utils';

export function GlobalSearchPanelBody(props: {
  warehouseId: string | null;
  parties: GlobalSearchParty[];
  lots: GlobalSearchLot[];
  loading: boolean;
  errMsg: string | null;
  showEmpty: boolean;
  showMinCharsHint: boolean;
  /** True when user has not typed (dropdown idle empty state) */
  showStartHint: boolean;
  onPickParty: (id: string) => void;
  onPickLot: (id: string) => void;
}) {
  const { t } = useTranslation('search');

  return (
    <div className="max-h-[min(60vh,420px)] overflow-y-auto px-2 py-2">
      {!props.warehouseId ? (
        <p className="px-2 py-4 text-body-sm text-text-secondary">{t('need_warehouse')}</p>
      ) : null}

      {props.showStartHint ? (
        <p className="px-2 py-4 text-body-sm text-text-tertiary">{t('start_hint')}</p>
      ) : null}

      {props.showMinCharsHint ? (
        <p className="px-2 py-3 text-body-sm text-text-tertiary">{t('min_chars')}</p>
      ) : null}

      {props.loading ? (
        <p className="px-2 py-3 text-body-sm text-text-tertiary">{t('loading')}</p>
      ) : null}

      {props.errMsg ? (
        <p className="px-2 py-3 text-body-sm text-outward" role="alert">
          {props.errMsg}
        </p>
      ) : null}

      {props.showEmpty ? (
        <p className="px-2 py-3 text-body-sm text-text-tertiary">{t('empty')}</p>
      ) : null}

      {props.parties.length > 0 ? (
        <section className="mb-3">
          <h3 className="px-2 py-1 font-mono text-label uppercase text-text-tertiary">
            {t('parties_section')}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {props.parties.map((p) => (
              <li key={p.customerId}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full min-h-touch items-center gap-2 rounded-base px-2 py-2 text-left text-body-sm text-text-primary',
                    'hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ui/30',
                  )}
                  onClick={() => props.onPickParty(p.customerId)}
                >
                  <Users className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{p.customerName}</span>
                    <span className="text-text-tertiary"> · {p.customerCode}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {props.lots.length > 0 ? (
        <section>
          <h3 className="px-2 py-1 font-mono text-label uppercase text-text-tertiary">
            {t('lots_section')}
          </h3>
          <ul className="flex flex-col gap-0.5">
            {props.lots.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full min-h-touch items-center gap-2 rounded-base px-2 py-2 text-left text-body-sm text-text-primary',
                    'hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ui/30',
                  )}
                  onClick={() => props.onPickLot(l.id)}
                >
                  <Package className="h-4 w-4 shrink-0 text-text-tertiary" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-mono font-semibold">{l.lotNumber}</span>
                    <span className="block truncate text-caption text-text-tertiary">
                      {l.customerName} · {l.productName}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
