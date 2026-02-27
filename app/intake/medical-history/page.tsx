'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MedicalHistoryForm } from '../../../components/forms/MedicalHistoryForm';
import { IntakeFooter } from '../../../components/layout/IntakeFooter';
import { useIntakeForm } from '../../../hooks/useIntakeForm';

export default function MedicalHistoryPage() {
  const router = useRouter();
  const { nextStep, prevStep, currentStep } = useIntakeForm();

  const handleNext = () => {
    nextStep();
    router.push('/intake/review');
  };

  const handleBack = () => {
    prevStep();
    router.push('/intake/insurance');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Medical History</h2>
      <MedicalHistoryForm onNext={handleNext} />
      <IntakeFooter
        onBack={handleBack}
        onNext={handleNext}
        showBack={currentStep > 1}
        nextLabel="Continue to Review"
      />
    </div>
  );
}



