'use client';

import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Select } from '../ui/Select';
import { useIntakeForm } from '../../hooks/useIntakeForm';
import { insuranceSchema, type InsuranceFormData } from '../../lib/validation';

const relationshipOptions = [
  { value: 'Self', label: 'Self' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Other', label: 'Other' },
];

interface InsuranceFormProps {
  onNext: () => void;
}

export function InsuranceForm({ onNext }: InsuranceFormProps) {
  const { insurance, setInsurance } = useIntakeForm();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [noInsurance, setNoInsurance] = useState(insurance.noInsurance || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: InsuranceFormData = {
      noInsurance,
      carrierName: (e.target as any).carrierName?.value || '',
      policyNumber: (e.target as any).policyNumber?.value || '',
      groupNumber: (e.target as any).groupNumber?.value || '',
      subscriberName: (e.target as any).subscriberName?.value || '',
      subscriberRelationship: (e.target as any).subscriberRelationship?.value || '',
      subscriberDob: (e.target as any).subscriberDob?.value || '',
      authorizationNumber: (e.target as any).authorizationNumber?.value || '',
    };

    try {
      await insuranceSchema.parseAsync(formData);
      setInsurance(formData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <input
          type="checkbox"
          id="noInsurance"
          checked={noInsurance}
          onChange={(e) => setNoInsurance(e.target.checked)}
          className="w-6 h-6"
        />
        <label htmlFor="noInsurance" className="text-lg font-medium">
          I don't have insurance
        </label>
      </div>

      {!noInsurance && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Insurance Carrier"
              name="carrierName"
              defaultValue={insurance.carrierName}
              required
              error={errors.carrierName}
            />
            <Input
              label="Policy Number"
              name="policyNumber"
              defaultValue={insurance.policyNumber}
              error={errors.policyNumber}
            />
            <Input
              label="Group Number"
              name="groupNumber"
              defaultValue={insurance.groupNumber}
              error={errors.groupNumber}
            />
            <Input
              label="Subscriber Name"
              name="subscriberName"
              defaultValue={insurance.subscriberName}
              required
              error={errors.subscriberName}
            />
            <Select
              label="Relationship to Patient"
              name="subscriberRelationship"
              options={relationshipOptions}
              defaultValue={insurance.subscriberRelationship}
              required
              error={errors.subscriberRelationship}
            />
            <DatePicker
              label="Subscriber Date of Birth"
              name="subscriberDob"
              defaultValue={insurance.subscriberDob}
              error={errors.subscriberDob}
            />
            <Input
              label="Authorization Number"
              name="authorizationNumber"
              defaultValue={insurance.authorizationNumber}
              error={errors.authorizationNumber}
            />
          </div>
        </div>
      )}
    </form>
  );
}



