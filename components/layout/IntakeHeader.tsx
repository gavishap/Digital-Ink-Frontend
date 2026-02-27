'use client';

import React from 'react';
import { ProgressIndicator } from '../ui/ProgressIndicator';

interface IntakeHeaderProps {
  currentStep: number;
  totalSteps?: number;
}

const stepLabels = ['Your Information', 'Insurance', 'Medical History', 'Review'];

export function IntakeHeader({ currentStep, totalSteps = 4 }: IntakeHeaderProps) {
  return (
    <header className="w-full bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={stepLabels}
        />
      </div>
    </header>
  );
}



