'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { Toaster } from 'sonner';
import { useState, type ReactNode } from 'react';
import '@/lib/i18n';
import { i18n } from '@/lib/i18n';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="bottom-center" richColors closeButton={false} duration={2000} />
      </QueryClientProvider>
    </I18nextProvider>
  );
}
