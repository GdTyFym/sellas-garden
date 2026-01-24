import { Suspense } from 'react';
import LoginClient from './LoginClient';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center px-6 py-16 text-sm text-white/60">
          Loading...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
