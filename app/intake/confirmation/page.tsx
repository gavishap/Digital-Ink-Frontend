'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { useIntakeForm } from '../../../hooks/useIntakeForm';

export default function ConfirmationPage() {
  const router = useRouter();
  const { demographics, reset } = useIntakeForm();

  useEffect(() => {
    // Auto-reset after 60 seconds
    const timer = setTimeout(() => {
      reset();
      router.push('/');
    }, 60000);

    return () => clearTimeout(timer);
  }, [router, reset]);

  const handleDone = () => {
    reset();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-4">
            Your information has been received.
          </p>
          {demographics.firstName && demographics.lastName && (
            <p className="text-base text-gray-700 font-medium">
              {demographics.firstName} {demographics.lastName}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-gray-700">
            Please remain seated. A staff member will call you shortly.
          </p>
        </div>

        {/* Done Button */}
        <Button variant="primary" size="lg" onClick={handleDone} className="w-full">
          Done
        </Button>
      </div>
    </div>
  );
}



