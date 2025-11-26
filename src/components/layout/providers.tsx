'use client';
import { SessionProvider } from 'next-auth/react';
import React from 'react';

import { ActiveThemeProvider } from '../active-theme';
import { TRPCReactProvider } from '@/trpc/react';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <TRPCReactProvider>
      <SessionProvider>
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          {children}
        </ActiveThemeProvider>
      </SessionProvider>
    </TRPCReactProvider>
  );
}
