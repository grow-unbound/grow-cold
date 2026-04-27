'use client';

import { formatUpdatedAgo } from '@growcold/shared';
import { MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ContactSheet } from '@/components/parties-tab/contact-sheet';
import { usePartyDetail } from '@/lib/shell-queries';
import { cn } from '@/lib/utils';
import { CustomerSummary } from './CustomerSummary';
import { LotsList } from './LotsList';
import { ReceiptsList } from './ReceiptsList';

type TabId = 'lots' | 'receipts';

interface Props {
  warehouseId: string;
  customerId: string;
}

export function PartyDetailsView({ warehouseId, customerId }: Props) {
  const { t } = useTranslation('pages');
  const q = usePartyDetail(warehouseId, customerId);
  const [tab, setTab] = useState<TabId>('lots');
  const [contactOpen, setContactOpen] = useState(false);

  const data = q.data;
  const isLoading = q.isPending;
  const isError = q.isError;

  const phoneForContact = useMemo(() => {
    if (!data) return '';
    return (data.phone ?? '').trim() || (data.mobile ?? '').trim() || '';
  }, [data]);

  const updatedAgo =
    q.isSuccess && q.dataUpdatedAt ? formatUpdatedAgo(q.dataUpdatedAt) : null;

  if (!warehouseId) {
    return (
      <div className="card w-full max-w-3xl lg:max-w-5xl">
        <p className="text-body-sm text-neutral-600">{t('select_warehouse')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-3 py-6 lg:max-w-5xl lg:px-6">
        <p className="text-body-sm text-neutral-600">{t('loading')}</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-3 py-6 lg:max-w-5xl lg:px-6">
        <Link href="/parties" className="text-sm font-medium text-cyan-700">
          ← {t('back')}
        </Link>
        <p className="mt-4 text-body-sm text-danger-600">{t('error_load')}</p>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'lots', label: t('parties.party_detail.tab_lots') },
    { id: 'receipts', label: t('parties.party_detail.tab_receipts') },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-5xl">
      <div className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="flex h-14 items-center gap-2 px-2 sm:px-3">
          <Link
            href="/parties"
            className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-lg px-2 text-lg font-medium text-cyan-700"
            aria-label={t('parties.party_detail.back_aria')}
          >
            ←
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-center text-lg font-semibold text-neutral-900">
            {data.customerCode}
          </h1>
          <button
            type="button"
            className="flex min-h-touch min-w-touch shrink-0 items-center justify-center rounded-lg px-2 text-neutral-400"
            disabled
            aria-disabled="true"
            aria-label={t('parties.party_detail.menu_aria')}
            title={t('parties.party_detail.menu_disabled_hint')}
          >
            <MoreVertical className="h-6 w-6" aria-hidden />
          </button>
        </div>
        <div
          className="flex border-t border-neutral-100 px-2 sm:px-3"
          role="tablist"
          aria-label={t('parties.party_detail.tabs_aria')}
        >
          {tabs.map((x) => {
            const active = tab === x.id;
            return (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(
                  'min-h-touch flex-1 border-b-[3px] py-3 text-sm font-medium transition-colors',
                  active ? 'border-dashboard-lodged text-dashboard-lodged' : 'border-transparent text-neutral-500',
                )}
                onClick={() => setTab(x.id)}
              >
                {x.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 px-3 py-4 sm:px-4 lg:px-6">
        <CustomerSummary
          data={data}
          onPhonePress={() => {
            if (phoneForContact) setContactOpen(true);
          }}
          updatedAgo={updatedAgo}
        />

        {tab === 'lots' ? <LotsList lots={data.lots} /> : null}
        {tab === 'receipts' ? (
          <ReceiptsList
            receipts={data.receipts}
            hasMore={q.hasNextPage ?? false}
            onLoadMore={() => void q.fetchNextPage()}
            isFetchingMore={q.isFetchingNextPage}
          />
        ) : null}
      </div>

      <ContactSheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        code={data.customerCode}
        phoneDigits={phoneForContact}
      />
    </div>
  );
}
