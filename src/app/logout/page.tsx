"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clearToken } from '../../utils/auth';

const LogoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);
  
  const reason = searchParams?.get('reason') || 'logged_out';
  
  const messages = {
    expired: 'Your session has expired',
    logged_out: 'You have been logged out',
    unauthorized: 'Unauthorized access detected'
  };

  useEffect(() => {
    // Clear all authentication data
    clearToken();
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          router.push('/signin');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {messages[reason as keyof typeof messages]}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Redirecting to login page in {countdown} seconds...
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <button
            onClick={() => router.push('/signin')}
            className="mt-4 text-blue-600 hover:text-blue-500 text-sm underline"
          >
            Go to login now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
