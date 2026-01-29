/**
 * Zod Validation Schemas
 * Form validation for patient intake
 */

import { z } from 'zod';

// Helper: Phone number validation (US format)
const phoneRegex = /^[\d\s\-\(\)]+$/;

// Helper: ZIP code validation (5 or 9 digits)
const zipRegex = /^\d{5}(-\d{4})?$/;

// Helper: SSN last 4 validation
const ssnLastFourRegex = /^\d{4}$/;

// Helper: Name validation (letters, spaces, hyphens, apostrophes)
const nameRegex = /^[a-zA-Z\s\-']+$/;

// Helper: Date validation (not future, reasonable age)
const validateDate = (date: string) => {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (d > today) {
    return false; // Cannot be future date
  }
  
  const age = today.getFullYear() - d.getFullYear();
  if (age > 120 || age < 0) {
    return false; // Reasonable age range
  }
  
  return true;
};

// Demographics Schema
export const demographicsSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long')
    .regex(nameRegex, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long')
    .regex(nameRegex, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  middleName: z
    .string()
    .max(100, 'Middle name is too long')
    .regex(nameRegex, 'Middle name can only contain letters, spaces, hyphens, and apostrophes')
    .optional()
    .or(z.literal('')),
  
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(validateDate, {
      message: 'Date of birth must be a valid date and cannot be in the future',
    }),
  
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say']).optional(),
  
  ssnLastFour: z
    .string()
    .regex(ssnLastFourRegex, 'Last 4 SSN must be exactly 4 digits')
    .optional()
    .or(z.literal('')),
  
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  
  phonePrimary: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(phoneRegex, 'Invalid phone number format'),
  
  phoneSecondary: z
    .string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  addressStreet: z
    .string()
    .min(1, 'Street address is required')
    .max(255, 'Address is too long'),
  
  addressCity: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City name is too long'),
  
  addressState: z
    .string()
    .min(2, 'State is required')
    .max(50, 'State name is too long'),
  
  addressZip: z
    .string()
    .min(5, 'ZIP code must be at least 5 digits')
    .regex(zipRegex, 'ZIP code must be 5 or 9 digits'),
  
  emergencyContactName: z
    .string()
    .min(1, 'Emergency contact name is required')
    .max(200, 'Name is too long'),
  
  emergencyContactPhone: z
    .string()
    .min(10, 'Emergency contact phone must be at least 10 digits')
    .regex(phoneRegex, 'Invalid phone number format'),
  
  emergencyContactRelationship: z
    .string()
    .min(1, 'Relationship is required')
    .max(50, 'Relationship is too long'),
});

export type DemographicsFormData = z.infer<typeof demographicsSchema>;

// Insurance Schema
export const insuranceSchema = z.object({
  noInsurance: z.boolean().optional(),
  
  carrierName: z
    .string()
    .min(1, 'Insurance carrier is required')
    .max(200, 'Carrier name is too long')
    .optional(),
  
  policyNumber: z
    .string()
    .max(100, 'Policy number is too long')
    .optional()
    .or(z.literal('')),
  
  groupNumber: z
    .string()
    .max(100, 'Group number is too long')
    .optional()
    .or(z.literal('')),
  
  subscriberName: z
    .string()
    .max(200, 'Subscriber name is too long')
    .optional()
    .or(z.literal('')),
  
  subscriberRelationship: z
    .string()
    .max(50, 'Relationship is too long')
    .optional()
    .or(z.literal('')),
  
  subscriberDob: z
    .string()
    .optional()
    .or(z.literal('')),
  
  authorizationNumber: z
    .string()
    .max(100, 'Authorization number is too long')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    // If no insurance, skip validation
    if (data.noInsurance) return true;
    // Otherwise, carrier name and subscriber name are required
    return !!(data.carrierName && data.subscriberName);
  },
  {
    message: 'Insurance carrier and subscriber name are required',
    path: ['carrierName'],
  }
);

export type InsuranceFormData = z.infer<typeof insuranceSchema>;

// Medical History Schema
export const medicalHistorySchema = z.object({
  chiefComplaint: z
    .string()
    .min(1, 'Chief complaint is required')
    .max(1000, 'Chief complaint is too long'),
  
  symptomOnsetDate: z
    .string()
    .min(1, 'Symptom onset date is required')
    .refine(validateDate, {
      message: 'Symptom onset date must be a valid date',
    }),
  
  symptomDescription: z
    .string()
    .max(5000, 'Description is too long')
    .optional()
    .or(z.literal('')),
  
  painLevel: z
    .number()
    .min(0, 'Pain level must be between 0 and 10')
    .max(10, 'Pain level must be between 0 and 10'),
  
  currentMedications: z
    .string()
    .max(2000, 'Medications list is too long')
    .optional()
    .or(z.literal('')),
  
  allergies: z
    .string()
    .max(2000, 'Allergies list is too long')
    .optional()
    .or(z.literal('')),
  
  pastSurgeries: z
    .string()
    .max(2000, 'Surgeries list is too long')
    .optional()
    .or(z.literal('')),
  
  chronicConditions: z.array(z.string()).optional(),
  
  familyHistory: z
    .string()
    .max(2000, 'Family history is too long')
    .optional()
    .or(z.literal('')),
  
  injuryDate: z
    .string()
    .optional()
    .or(z.literal('')),
  
  injuryDescription: z
    .string()
    .max(2000, 'Injury description is too long')
    .optional()
    .or(z.literal('')),
  
  injuryLocation: z
    .string()
    .max(255, 'Location is too long')
    .optional()
    .or(z.literal('')),
  
  injuryCause: z
    .string()
    .max(2000, 'Cause description is too long')
    .optional()
    .or(z.literal('')),
  
  employerName: z
    .string()
    .max(200, 'Employer name is too long')
    .optional()
    .or(z.literal('')),
  
  occupation: z
    .string()
    .max(200, 'Occupation is too long')
    .optional()
    .or(z.literal('')),
  
  attorneyName: z
    .string()
    .max(200, 'Attorney name is too long')
    .optional()
    .or(z.literal('')),
  
  attorneyFirm: z
    .string()
    .max(200, 'Law firm name is too long')
    .optional()
    .or(z.literal('')),
  
  attorneyPhone: z
    .string()
    .regex(phoneRegex, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  
  caseNumber: z
    .string()
    .max(100, 'Case number is too long')
    .optional()
    .or(z.literal('')),
});

export type MedicalHistoryFormData = z.infer<typeof medicalHistorySchema>;



