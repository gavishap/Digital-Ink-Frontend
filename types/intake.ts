/**
 * Intake App Type Definitions
 * Re-exports from shared types and adds app-specific types
 */

export type {
  Patient,
  PatientInsurance,
  PatientMedicalHistory,
  IntakeSession,
  DemographicsData,
  InsuranceData,
  MedicalHistoryData,
} from '../../../lib/types/database';

export type IntakeStep = 1 | 2 | 3 | 4;

export interface IntakeFormState {
  sessionId: string | null;
  patientId: string | null;
  currentStep: IntakeStep;
  demographics: DemographicsData;
  insurance: InsuranceData;
  medicalHistory: MedicalHistoryData;
  signature: string | null;
}



