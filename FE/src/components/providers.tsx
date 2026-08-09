'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 1000, // 10 seconds
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1,
            throwOnError: false,
            // No global polling — real-time views opt in per-query via
            // `refetchInterval: REFRESH_INTERVAL` so static data (RBAC, configs,
            // audit logs) isn't re-fetched every 10s.
          },
        },
      })
  )

  // App runs against the real backend (NEXT_PUBLIC_API_BASE) — no MSW mock bootstrap.
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
