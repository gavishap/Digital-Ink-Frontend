'use client';

import React from 'react';
import { Button } from '../ui/Button';

interface IntakeFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  isLoading?: boolean;
}

export function IntakeFooter({
  onBack,
  onNext,
  showBack = true,
  showNext = true,
  nextLabel = 'Next',
  backLabel = 'Back',
  isLoading = false,
}: IntakeFooterProps) {
  return (
    <footer className="w-full bg-white border-t border-gray-200 px-6 py-4">
      <div className="max-w-4xl mx-auto flex justify-between gap-4">
        {showBack && onBack && (
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            {backLabel}
          </Button>
        )}
        <div className="flex-1" />
        {showNext && onNext && (
          <Button variant="primary" onClick={onNext} disabled={isLoading}>
            {isLoading ? 'Loading...' : nextLabel}
          </Button>
        )}
      </div>
    </footer>
  );
}



