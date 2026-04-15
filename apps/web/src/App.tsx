import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { PlaceholderPage } from '@/pages/placeholder-page';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<PlaceholderPage titleKey="home" />} />
            <Route path="inventory" element={<PlaceholderPage titleKey="inventory" />} />
            <Route path="parties" element={<PlaceholderPage titleKey="parties" />} />
            <Route path="receipts" element={<PlaceholderPage titleKey="receipts" />} />
            <Route path="payments" element={<PlaceholderPage titleKey="payments" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
