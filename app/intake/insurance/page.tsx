'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InsuranceForm } from '../../../components/forms/InsuranceForm';
import { IntakeFooter } from '../../../components/layout/IntakeFooter';
import { useIntakeForm } from '../../../hooks/useIntakeForm';

export default function InsurancePage() {
  const router = useRouter();
  const { nextStep, prevStep, currentStep } = useIntakeForm();

  const handleNext = () => {
    nextStep();
    router.push('/intake/medical-history');
  };

  const handleBack = () => {
    prevStep();
    router.push('/intake/demographics');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Insurance Information</h2>
      <InsuranceForm onNext={handleNext} />
      <IntakeFooter
        onBack={handleBack}
        onNext={handleNext}
        showBack={currentStep > 1}
        nextLabel="Continue to Medical History"
      />
    </div>
  );
}



