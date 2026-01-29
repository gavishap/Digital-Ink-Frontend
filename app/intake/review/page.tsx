'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReviewForm } from '../../../components/forms/ReviewForm';
import { IntakeFooter } from '../../../components/layout/IntakeFooter';
import { useIntakeForm } from '../../../hooks/useIntakeForm';
import {
  createPatient,
  createPatientInsurance,
  createPatientMedicalHistory,
  createIntakeSession,
  completeIntake,
} from '../../../lib/api/intake';

export default function ReviewPage() {
  const router = useRouter();
  const { prevStep, demographics, insurance, medicalHistory, setPatientId, setSessionId, reset } =
    useIntakeForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    prevStep();
    router.push('/intake/medical-history');
  };

  const handleEdit = (step: number) => {
    const routes = ['', '/intake/demographics', '/intake/insurance', '/intake/medical-history'];
    router.push(routes[step]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create patient
      const patient = await createPatient(demographics as any);
      setPatientId(patient.id);

      // Create insurance (if provided)
      if (!insurance.noInsurance && insurance.carrierName) {
        await createPatientInsurance(patient.id, insurance as any);
      }

      // Create medical history
      await createPatientMedicalHistory(patient.id, medicalHistory as any);

      // Create and complete intake session
      const session = await createIntakeSession(patient.id);
      setSessionId(session.id);
      await completeIntake(session.id);

      // Reset form and redirect to confirmation
      reset();
      router.push('/intake/confirmation');
    } catch (error: any) {
      console.error('Submission error:', error);
      alert(`Error submitting intake: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review & Submit</h2>
      <ReviewForm onSubmit={handleSubmit} onEdit={handleEdit} />
      <IntakeFooter
        onBack={handleBack}
        showNext={false}
        backLabel="Back to Medical History"
      />
    </div>
  );
}

