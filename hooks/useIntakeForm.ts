/**
 * Intake Form State Management
 * Uses Zustand with persistence for draft saving
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DemographicsData,
  InsuranceData,
  MedicalHistoryData,
} from '../../lib/types/database';

interface IntakeFormState {
  sessionId: string | null;
  patientId: string | null;
  currentStep: number;
  demographics: Partial<DemographicsData>;
  insurance: Partial<InsuranceData>;
  medicalHistory: Partial<MedicalHistoryData>;
  signature: string | null;

  // Actions
  setDemographics: (data: Partial<DemographicsData>) => void;
  setInsurance: (data: Partial<InsuranceData>) => void;
  setMedicalHistory: (data: Partial<MedicalHistoryData>) => void;
  setSignature: (signature: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
  reset: () => void;
  setSessionId: (id: string) => void;
  setPatientId: (id: string) => void;
}

const initialDemographics: Partial<DemographicsData> = {
  firstName: '',
  lastName: '',
  middleName: '',
  dateOfBirth: '',
  gender: undefined,
  ssnLastFour: '',
  email: '',
  phonePrimary: '',
  phoneSecondary: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressZip: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
};

const initialInsurance: Partial<InsuranceData> = {
  carrierName: '',
  policyNumber: '',
  groupNumber: '',
  subscriberName: '',
  subscriberRelationship: '',
  subscriberDob: '',
  authorizationNumber: '',
  noInsurance: false,
};

const initialMedicalHistory: Partial<MedicalHistoryData> = {
  chiefComplaint: '',
  symptomOnsetDate: '',
  symptomDescription: '',
  painLevel: 0,
  currentMedications: '',
  allergies: '',
  pastSurgeries: '',
  chronicConditions: [],
  familyHistory: '',
  injuryDate: '',
  injuryDescription: '',
  injuryLocation: '',
  injuryCause: '',
  employerName: '',
  occupation: '',
  attorneyName: '',
  attorneyFirm: '',
  attorneyPhone: '',
  caseNumber: '',
};

export const useIntakeForm = create<IntakeFormState>()(
  persist(
    (set) => ({
      sessionId: null,
      patientId: null,
      currentStep: 1,
      demographics: initialDemographics,
      insurance: initialInsurance,
      medicalHistory: initialMedicalHistory,
      signature: null,

      setDemographics: (data) =>
        set((state) => ({
          demographics: { ...state.demographics, ...data },
        })),

      setInsurance: (data) =>
        set((state) => ({
          insurance: { ...state.insurance, ...data },
        })),

      setMedicalHistory: (data) =>
        set((state) => ({
          medicalHistory: { ...state.medicalHistory, ...data },
        })),

      setSignature: (signature) => set({ signature }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 4),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      setStep: (step) => set({ currentStep: step }),

      reset: () =>
        set({
          sessionId: null,
          patientId: null,
          currentStep: 1,
          demographics: initialDemographics,
          insurance: initialInsurance,
          medicalHistory: initialMedicalHistory,
          signature: null,
        }),

      setSessionId: (id) => set({ sessionId: id }),
      setPatientId: (id) => set({ patientId: id }),
    }),
    {
      name: 'intake-form-storage',
    }
  )
);



