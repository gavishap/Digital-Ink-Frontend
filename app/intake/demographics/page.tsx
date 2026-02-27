'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DemographicsForm } from '../../../components/forms/DemographicsForm';
import { IntakeFooter } from '../../../components/layout/IntakeFooter';
import { useIntakeForm } from '../../../hooks/useIntakeForm';

export default function DemographicsPage() {
  const router = useRouter();
  const { nextStep, prevStep, currentStep } = useIntakeForm();

  const handleNext = () => {
    nextStep();
    router.push('/intake/insurance');
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Information</h2>
      <DemographicsForm onNext={handleNext} />
      <IntakeFooter
        onBack={handleBack}
        onNext={handleNext}
        showBack={currentStep > 1}
        nextLabel="Continue to Insurance"
      />
    </div>
  );
}



