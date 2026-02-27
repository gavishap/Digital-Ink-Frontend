'use client';

import React, { useState } from 'react';
import { demographicsSchema, type DemographicsFormData } from '../../lib/validation';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Select } from '../ui/Select';
import { useIntakeForm } from '../../hooks/useIntakeForm';

const genderOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const relationshipOptions = [
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Other', label: 'Other' },
];

const usStates = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

interface DemographicsFormProps {
  onNext: () => void;
}

export function DemographicsForm({ onNext }: DemographicsFormProps) {
  const { demographics, setDemographics } = useIntakeForm();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: DemographicsFormData = {
      firstName: (e.target as any).firstName?.value || '',
      lastName: (e.target as any).lastName?.value || '',
      middleName: (e.target as any).middleName?.value || '',
      dateOfBirth: (e.target as any).dateOfBirth?.value || '',
      gender: (e.target as any).gender?.value || undefined,
      ssnLastFour: (e.target as any).ssnLastFour?.value || '',
      email: (e.target as any).email?.value || '',
      phonePrimary: (e.target as any).phonePrimary?.value || '',
      phoneSecondary: (e.target as any).phoneSecondary?.value || '',
      addressStreet: (e.target as any).addressStreet?.value || '',
      addressCity: (e.target as any).addressCity?.value || '',
      addressState: (e.target as any).addressState?.value || '',
      addressZip: (e.target as any).addressZip?.value || '',
      emergencyContactName: (e.target as any).emergencyContactName?.value || '',
      emergencyContactPhone: (e.target as any).emergencyContactPhone?.value || '',
      emergencyContactRelationship: (e.target as any).emergencyContactRelationship?.value || '',
    };

    try {
      await demographicsSchema.parseAsync(formData);
      setDemographics(formData);
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

  // Auto-capitalize names
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const capitalized = value
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    e.target.value = capitalized;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          name="firstName"
          required
          defaultValue={demographics.firstName}
          error={errors.firstName}
          onChange={handleNameChange}
          autoCapitalize="words"
        />
        <Input
          label="Middle Name"
          name="middleName"
          defaultValue={demographics.middleName}
          error={errors.middleName}
          onChange={handleNameChange}
          autoCapitalize="words"
        />
        <Input
          label="Last Name"
          name="lastName"
          required
          defaultValue={demographics.lastName}
          error={errors.lastName}
          onChange={handleNameChange}
          autoCapitalize="words"
        />
        <DatePicker
          label="Date of Birth"
          name="dateOfBirth"
          required
          defaultValue={demographics.dateOfBirth}
          error={errors.dateOfBirth}
        />
        <Select
          label="Gender"
          name="gender"
          options={genderOptions}
          defaultValue={demographics.gender}
          error={errors.gender}
        />
        <Input
          label="Last 4 of SSN"
          name="ssnLastFour"
          maxLength={4}
          inputMode="numeric"
          defaultValue={demographics.ssnLastFour}
          error={errors.ssnLastFour}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          defaultValue={demographics.email}
          error={errors.email}
        />
        <Input
          label="Phone (Primary)"
          name="phonePrimary"
          required
          type="tel"
          inputMode="tel"
          defaultValue={demographics.phonePrimary}
          error={errors.phonePrimary}
        />
        <Input
          label="Phone (Secondary)"
          name="phoneSecondary"
          type="tel"
          inputMode="tel"
          defaultValue={demographics.phoneSecondary}
          error={errors.phoneSecondary}
        />
        <Input
          label="Street Address"
          name="addressStreet"
          required
          defaultValue={demographics.addressStreet}
          error={errors.addressStreet}
        />
        <Input
          label="City"
          name="addressCity"
          required
          defaultValue={demographics.addressCity}
          error={errors.addressCity}
        />
        <Select
          label="State"
          name="addressState"
          required
          options={usStates}
          defaultValue={demographics.addressState}
          error={errors.addressState}
        />
        <Input
          label="ZIP Code"
          name="addressZip"
          required
          inputMode="numeric"
          maxLength={10}
          defaultValue={demographics.addressZip}
          error={errors.addressZip}
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Contact Name"
            name="emergencyContactName"
            required
            defaultValue={demographics.emergencyContactName}
            error={errors.emergencyContactName}
            autoCapitalize="words"
          />
          <Input
            label="Contact Phone"
            name="emergencyContactPhone"
            required
            type="tel"
            inputMode="tel"
            defaultValue={demographics.emergencyContactPhone}
            error={errors.emergencyContactPhone}
          />
          <Select
            label="Relationship"
            name="emergencyContactRelationship"
            required
            options={relationshipOptions}
            defaultValue={demographics.emergencyContactRelationship}
            error={errors.emergencyContactRelationship}
          />
        </div>
      </div>
    </form>
  );
}
