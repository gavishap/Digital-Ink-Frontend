'use client';

import React from 'react';
import { IntakeHeader } from '../../components/layout/IntakeHeader';
import { useIntakeForm } from '../../hooks/useIntakeForm';

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentStep } = useIntakeForm();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <IntakeHeader currentStep={currentStep} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}



