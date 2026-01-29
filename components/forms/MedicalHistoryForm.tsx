'use client';

import React, { useState } from 'react';
import { TextArea } from '../ui/TextArea';
import { DatePicker } from '../ui/DatePicker';
import { Input } from '../ui/Input';
import { Slider } from '../ui/Slider';
import { useIntakeForm } from '../../hooks/useIntakeForm';
import { medicalHistorySchema, type MedicalHistoryFormData } from '../../lib/validation';

const chronicConditions = [
  'Diabetes',
  'High Blood Pressure',
  'Heart Disease',
  'Arthritis',
  'Cancer',
  'Asthma/COPD',
  'Depression/Anxiety',
];

interface MedicalHistoryFormProps {
  onNext: () => void;
}

export function MedicalHistoryForm({ onNext }: MedicalHistoryFormProps) {
  const { medicalHistory, setMedicalHistory } = useIntakeForm();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    medicalHistory.chronicConditions || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: MedicalHistoryFormData = {
      chiefComplaint: (e.target as any).chiefComplaint?.value || '',
      symptomOnsetDate: (e.target as any).symptomOnsetDate?.value || '',
      symptomDescription: (e.target as any).symptomDescription?.value || '',
      painLevel: Number((e.target as any).painLevel?.value) || 0,
      currentMedications: (e.target as any).currentMedications?.value || '',
      allergies: (e.target as any).allergies?.value || '',
      pastSurgeries: (e.target as any).pastSurgeries?.value || '',
      chronicConditions: selectedConditions,
      familyHistory: (e.target as any).familyHistory?.value || '',
      injuryDate: (e.target as any).injuryDate?.value || '',
      injuryDescription: (e.target as any).injuryDescription?.value || '',
      injuryLocation: (e.target as any).injuryLocation?.value || '',
      injuryCause: (e.target as any).injuryCause?.value || '',
      employerName: (e.target as any).employerName?.value || '',
      occupation: (e.target as any).occupation?.value || '',
      attorneyName: (e.target as any).attorneyName?.value || '',
      attorneyFirm: (e.target as any).attorneyFirm?.value || '',
      attorneyPhone: (e.target as any).attorneyPhone?.value || '',
      caseNumber: (e.target as any).caseNumber?.value || '',
    };

    try {
      await medicalHistorySchema.parseAsync(formData);
      setMedicalHistory(formData);
      setErrors({});
      onNext();
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
      }
      setErrors(fieldErrors);
    }
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section A: Current Complaint */}
      <section className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">Current Complaint</h3>
        <div className="space-y-6">
          <TextArea
            label="What brings you in today?"
            name="chiefComplaint"
            defaultValue={medicalHistory.chiefComplaint}
            required
            autoExpand
            error={errors.chiefComplaint}
            rows={4}
          />
          <DatePicker
            label="When did symptoms begin?"
            name="symptomOnsetDate"
            defaultValue={medicalHistory.symptomOnsetDate}
            required
            error={errors.symptomOnsetDate}
          />
          <Slider
            label="Pain Level (0-10)"
            value={medicalHistory.painLevel || 0}
            onChange={(value) => {
              const input = document.querySelector('[name="painLevel"]') as HTMLInputElement;
              if (input) input.value = value.toString();
            }}
            showEmojis
          />
          <input type="hidden" name="painLevel" defaultValue={medicalHistory.painLevel || 0} />
          <TextArea
            label="Symptom Description"
            name="symptomDescription"
            defaultValue={medicalHistory.symptomDescription}
            autoExpand
            error={errors.symptomDescription}
            rows={3}
          />
        </div>
      </section>

      {/* Section B: Injury Information */}
      <section className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">Injury Information (if applicable)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DatePicker
            label="Date of Injury"
            name="injuryDate"
            defaultValue={medicalHistory.injuryDate}
            error={errors.injuryDate}
          />
          <Input
            label="Location where injury occurred"
            name="injuryLocation"
            defaultValue={medicalHistory.injuryLocation}
            error={errors.injuryLocation}
          />
          <TextArea
            label="How did the injury occur?"
            name="injuryDescription"
            defaultValue={medicalHistory.injuryDescription}
            autoExpand
            error={errors.injuryDescription}
            rows={3}
          />
          <Input
            label="Employer Name (if work-related)"
            name="employerName"
            defaultValue={medicalHistory.employerName}
            error={errors.employerName}
          />
          <Input
            label="Your Occupation"
            name="occupation"
            defaultValue={medicalHistory.occupation}
            error={errors.occupation}
          />
        </div>
      </section>

      {/* Section C: Medical Background */}
      <section className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">Medical Background</h3>
        <div className="space-y-6">
          <TextArea
            label="Current Medications"
            name="currentMedications"
            defaultValue={medicalHistory.currentMedications}
            autoExpand
            error={errors.currentMedications}
            rows={3}
          />
          <TextArea
            label="Allergies"
            name="allergies"
            defaultValue={medicalHistory.allergies}
            autoExpand
            error={errors.allergies}
            rows={3}
          />
          <TextArea
            label="Past Surgeries"
            name="pastSurgeries"
            defaultValue={medicalHistory.pastSurgeries}
            autoExpand
            error={errors.pastSurgeries}
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chronic Conditions
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {chronicConditions.map((condition) => (
                <label key={condition} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedConditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                    className="w-5 h-5"
                  />
                  <span>{condition}</span>
                </label>
              ))}
            </div>
          </div>
          <TextArea
            label="Family Medical History"
            name="familyHistory"
            defaultValue={medicalHistory.familyHistory}
            autoExpand
            error={errors.familyHistory}
            rows={3}
          />
        </div>
      </section>

      {/* Section D: Attorney Information */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Attorney Information (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Attorney Name"
            name="attorneyName"
            defaultValue={medicalHistory.attorneyName}
            error={errors.attorneyName}
          />
          <Input
            label="Law Firm"
            name="attorneyFirm"
            defaultValue={medicalHistory.attorneyFirm}
            error={errors.attorneyFirm}
          />
          <Input
            label="Attorney Phone"
            name="attorneyPhone"
            type="tel"
            inputMode="tel"
            defaultValue={medicalHistory.attorneyPhone}
            error={errors.attorneyPhone}
          />
          <Input
            label="Case Number"
            name="caseNumber"
            defaultValue={medicalHistory.caseNumber}
            error={errors.caseNumber}
          />
        </div>
      </section>
    </form>
  );
}



