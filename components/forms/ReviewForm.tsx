'use client';

import React, { useState } from 'react';
import { SignaturePad } from '../ui/SignaturePad';
import { Button } from '../ui/Button';
import { useIntakeForm } from '../../hooks/useIntakeForm';

interface ReviewFormProps {
  onSubmit: () => void;
  onEdit: (step: number) => void;
}

export function ReviewForm({ onSubmit, onEdit }: ReviewFormProps) {
  const { demographics, insurance, medicalHistory, signature, setSignature } = useIntakeForm();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignatureSave = (sig: string) => {
    setSignature(sig);
  };

  const handleSubmit = () => {
    if (!signature) {
      alert('Please provide your signature before submitting.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    onSubmit();
  };

  return (
    <div className="space-y-6">
      {/* Demographics Section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Demographics</h3>
          <Button variant="outline" size="sm" onClick={() => onEdit(1)}>
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Name:</span>{' '}
            {demographics.firstName} {demographics.middleName} {demographics.lastName}
          </div>
          <div>
            <span className="font-medium">DOB:</span> {demographics.dateOfBirth}
          </div>
          <div>
            <span className="font-medium">Phone:</span> {demographics.phonePrimary}
          </div>
          <div>
            <span className="font-medium">Email:</span> {demographics.email || 'N/A'}
          </div>
          <div className="col-span-2">
            <span className="font-medium">Address:</span>{' '}
            {demographics.addressStreet}, {demographics.addressCity}, {demographics.addressState} {demographics.addressZip}
          </div>
          <div>
            <span className="font-medium">Emergency Contact:</span> {demographics.emergencyContactName}
          </div>
          <div>
            <span className="font-medium">Emergency Phone:</span> {demographics.emergencyContactPhone}
          </div>
        </div>
      </section>

      {/* Insurance Section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Insurance</h3>
          <Button variant="outline" size="sm" onClick={() => onEdit(2)}>
            Edit
          </Button>
        </div>
        {insurance.noInsurance ? (
          <p className="text-gray-600">No insurance</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Carrier:</span> {insurance.carrierName}
            </div>
            <div>
              <span className="font-medium">Policy #:</span> {insurance.policyNumber || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Subscriber:</span> {insurance.subscriberName}
            </div>
            <div>
              <span className="font-medium">Relationship:</span> {insurance.subscriberRelationship}
            </div>
          </div>
        )}
      </section>

      {/* Medical History Section */}
      <section className="border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Medical History</h3>
          <Button variant="outline" size="sm" onClick={() => onEdit(3)}>
            Edit
          </Button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Chief Complaint:</span> {medicalHistory.chiefComplaint}
          </div>
          <div>
            <span className="font-medium">Pain Level:</span> {medicalHistory.painLevel}/10
          </div>
          {medicalHistory.currentMedications && (
            <div>
              <span className="font-medium">Medications:</span> {medicalHistory.currentMedications}
            </div>
          )}
          {medicalHistory.allergies && (
            <div>
              <span className="font-medium">Allergies:</span> {medicalHistory.allergies}
            </div>
          )}
        </div>
      </section>

      {/* Signature Section */}
      <section className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Digital Signature</h3>
        <p className="text-sm text-gray-600 mb-4">
          By signing below, I confirm that the information provided is accurate to the best of my knowledge.
        </p>
        {signature ? (
          <div className="mb-4">
            <img src={signature} alt="Signature" className="border rounded p-2 bg-white max-w-full" />
            <Button variant="outline" size="sm" onClick={() => setSignature(null)} className="mt-2">
              Clear & Retry
            </Button>
          </div>
        ) : (
          <SignaturePad onSave={handleSignatureSave} onClear={() => setSignature(null)} />
        )}
      </section>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!signature}
        >
          Submit Intake
        </Button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Submission</h3>
            <p className="text-gray-600 mb-6">
              Are you ready to submit? You won't be able to make changes after submission.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
                Go Back
              </Button>
              <Button variant="primary" onClick={handleConfirmSubmit} className="flex-1">
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



