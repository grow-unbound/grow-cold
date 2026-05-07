'use client';

import { HomeMobileHeader } from '@/components/layout/home-mobile-header';

export default function HomePage() {
  return (
    <>
      <HomeMobileHeader />
      <div className="flex w-full flex-col gap-4">
        <div className="skeleton h-24 w-full rounded-lg" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-20 rounded-lg" />
        </div>
        <div className="skeleton h-40 w-full rounded-lg" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="skeleton h-64 rounded-lg" />
          <div className="skeleton h-64 rounded-lg" />
        </div>
      </div>
    </>
  );
}
