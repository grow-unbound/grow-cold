import { formatINR, formatIndianNumber, type CommandCenterSnapshotResponse } from '@growcold/shared';
import { useTranslation } from 'react-i18next';

interface Props {
  data: CommandCenterSnapshotResponse | undefined;
  isLoading: boolean;
}

export function BusinessSnapshot({ data, isLoading }: Props) {
  const { t } = useTranslation('home');

  if (isLoading || !data) {
    return (
      <div className="mt-2 flex gap-2">
        <div className="h-[120px] flex-1 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-[120px] flex-1 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <div
        className="flex flex-1 flex-col gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"
        role="region"
        aria-label={t('cash_balance')}
      >
        <span className="text-2xl" aria-hidden>
          💰
        </span>
        <p className="text-2xl font-bold text-neutral-900">{formatINR(data.cashBalance)}</p>
        <p className="text-sm text-dashboard-muted">{t('cash_balance')}</p>
        <p className="text-sm text-dashboard-muted">
          {t('received_today')}: {formatINR(data.receivedToday)}
        </p>
        <p className="text-sm text-dashboard-muted">
          {t('paid_today')}: {formatINR(data.paidToday)}
        </p>
      </div>
      <div
        className="flex flex-1 flex-col gap-1 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"
        role="region"
        aria-label={t('total_bags')}
      >
        <span className="text-2xl" aria-hidden>
          📦
        </span>
        <p className="text-2xl font-bold text-neutral-900">{formatIndianNumber(data.totalBags)}</p>
        <p className="text-sm text-dashboard-muted">{t('total_bags')}</p>
        <p className="text-sm text-dashboard-muted">
          {t('total_lots')}: {data.totalLots}
        </p>
        <p className="text-sm text-dashboard-danger">
          {t('stale_lots')}: {data.staleLots}
        </p>
      </div>
    </div>
  );
}
