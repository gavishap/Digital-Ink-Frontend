/**
 * Intake App Type Definitions
 */

export interface DemographicsData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  ssnLastFour?: string;
  email?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export interface InsuranceData {
  noInsurance?: boolean;
  carrierName?: string;
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  subscriberName?: string;
  subscriberDob?: string;
  subscriberRelationship?: string;
  authorizationNumber?: string;
  secondaryProvider?: string;
  secondaryPolicyNumber?: string;
}

export interface MedicalHistoryData {
  chronicConditions?: string[];
  chiefComplaint?: string;
  symptomOnsetDate?: string;
  painLevel?: number;
  symptomDescription?: string;
  injuryDate?: string;
  injuryLocation?: string;
  injuryDescription?: string;
  injuryCause?: string;
  employerName?: string;
  occupation?: string;
  currentMedications?: string;
  allergies?: string;
  pastSurgeries?: string;
  familyHistory?: string;
  attorneyName?: string;
  attorneyFirm?: string;
  attorneyPhone?: string;
  caseNumber?: string;
}

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

