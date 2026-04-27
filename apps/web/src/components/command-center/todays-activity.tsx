import { formatINR, type CommandCenterActivityResponse } from '@growcold/shared';
import { useTranslation } from 'react-i18next';

interface Props {
  data: CommandCenterActivityResponse | undefined;
  isLoading: boolean;
}

export function TodaysActivity({ data, isLoading }: Props) {
  const { t } = useTranslation('home');

  if (isLoading || !data) {
    return <div className="mt-6 h-[140px] animate-pulse rounded-xl bg-neutral-200" />;
  }

  return (
    <section className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-dashboard-muted">
        {t('todays_activity')}
      </h2>
      <div className="flex flex-col gap-2">
        <p className="text-base text-neutral-900">
          <span className="text-dashboard-lodged">↓ </span>
          {t('lodgements_fmt', { count: data.lodgementsCount, bags: data.lodgementsBags })}
        </p>
        <p className="text-base text-neutral-900">
          <span className="text-dashboard-delivered">↑ </span>
          {t('deliveries_fmt', { count: data.deliveriesCount, bags: data.deliveriesBags })}
        </p>
        <p className="text-base text-neutral-900">
          <span className="text-dashboard-money">₹ </span>
          {t('collected_fmt', {
            amount: formatINR(data.collectedAmount),
            count: data.collectedCustomerCount,
          })}
        </p>
      </div>
    </section>
  );
}
