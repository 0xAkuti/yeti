'use client';

import { usePrivy } from '@privy-io/react-auth';
import { ReactNode } from 'react';

interface PrivyGuardProps {
  children: ReactNode;
}

export function PrivyGuard({ children }: PrivyGuardProps) {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="text-center text-gray-400">
            Loading wallet...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}