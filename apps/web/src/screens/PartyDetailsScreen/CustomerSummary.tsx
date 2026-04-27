'use client';

import type { PartyDetailData } from '@growcold/shared';
import { formatINR } from '@growcold/shared';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function parseYmdToDate(ymd: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return parseISO(ymd);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

interface Props {
  data: PartyDetailData;
  onPhonePress: () => void;
  updatedAgo?: string | null;
}

export function CustomerSummary({ data, onPhonePress, updatedAgo }: Props) {
  const { t } = useTranslation('pages');
  const noPhone = t('parties.no_phone');
  const phoneDisplay = (data.phone ?? '').trim() || (data.mobile ?? '').trim() || noPhone;
  const hasPhone = phoneDisplay !== noPhone;

  const outstandingColor = data.outstanding > 0 ? 'text-danger-600' : 'text-success-600';

  const lastActivityText = data.lastActivityDate
    ? formatDistanceToNow(parseYmdToDate(data.lastActivityDate), { addSuffix: true })
    : t('parties.party_detail.last_activity_never');

  return (
    <div className="rounded-xl bg-neutral-50 p-4">
      <h2 className="text-caption font-medium uppercase tracking-wide text-neutral-500">
        {t('parties.party_detail.summary_title')}
      </h2>
      <dl className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <dt className="w-28 shrink-0 text-body-sm text-neutral-500">{t('parties.party_detail.code')}</dt>
          <dd className="text-base font-semibold text-neutral-900">{data.customerCode}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <dt className="w-28 shrink-0 text-body-sm text-neutral-500">{t('parties.party_detail.phone')}</dt>
          <dd className="min-h-touch">
            {hasPhone ? (
              <button
                type="button"
                className="text-left text-base font-semibold text-cyan-700 underline-offset-2 hover:underline"
                onClick={onPhonePress}
                aria-label={t('parties.party_detail.phone_aria', { code: data.customerCode })}
              >
                {phoneDisplay}
              </button>
            ) : (
              <span className="text-base font-semibold text-neutral-400">{phoneDisplay}</span>
            )}
          </dd>
        </div>
        {data.address?.trim() ? (
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <dt className="w-28 shrink-0 text-body-sm text-neutral-500">{t('parties.party_detail.address')}</dt>
            <dd className="max-w-full flex-1 text-base font-semibold text-neutral-900">{data.address}</dd>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <dt className="w-28 shrink-0 text-body-sm text-neutral-500">{t('parties.party_detail.current_stock_label')}</dt>
          <dd className="text-base font-semibold text-neutral-900">
            {t('parties.party_detail.current_stock_value', {
              bags: data.currentStockBags.toLocaleString('en-IN'),
              lots: data.activeLotCount.toLocaleString('en-IN'),
            })}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <dt className="w-28 shrink-0 text-body-sm text-neutral-500">{t('parties.party_detail.outstanding')}</dt>
          <dd className={cn('text-base font-semibold', outstandingColor)}>{formatINR(data.outstanding)}</dd>
        </div>
      </dl>
      <div className="mt-3 space-y-1 border-t border-neutral-200/80 pt-3 text-body-sm text-neutral-600">
        <div className="flex gap-2 pl-0">
          <span className="font-mono text-neutral-400">├─</span>
          <span className="flex-1">
            <span className="text-neutral-500">{t('parties.party_detail.breakdown_rents')}:</span>{' '}
            <span className="font-medium text-neutral-800">{formatINR(data.rents)}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-mono text-neutral-400">├─</span>
          <span className="flex-1">
            <span className="text-neutral-500">{t('parties.party_detail.breakdown_charges')}:</span>{' '}
            <span className="font-medium text-neutral-800">{formatINR(data.charges)}</span>
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-mono text-neutral-400">└─</span>
          <span className="flex-1">
            <span className="text-neutral-500">{t('parties.party_detail.breakdown_others')}:</span>{' '}
            <span className="font-medium text-neutral-800">{formatINR(data.others)}</span>
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 border-t border-neutral-200/80 pt-3">
        <span className="w-28 shrink-0 text-body-sm text-neutral-500">{t('parties.party_detail.last_activity')}</span>
        <span className="text-base font-semibold text-neutral-900">{lastActivityText}</span>
      </div>
      {updatedAgo ? (
        <p className="mt-2 text-caption text-neutral-500">{t('parties.party_detail.updated_ago', { time: updatedAgo })}</p>
      ) : null}
    </div>
  );
}
