// @ts-nocheck
import { supabase } from '../supabase';
import type {
  Patient,
  PatientInsurance,
  PatientMedicalHistory,
  IntakeSession,
  DemographicsData,
  InsuranceData,
  MedicalHistoryData,
} from '../types/database';

function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

export async function createPatient(data: DemographicsData): Promise<Patient> {
  const dbData = {
    first_name: data.firstName,
    last_name: data.lastName,
    middle_name: data.middleName || null,
    date_of_birth: data.dateOfBirth,
    gender: data.gender || null,
    ssn_last_four: data.ssnLastFour || null,
    email: data.email || null,
    phone_primary: data.phonePrimary,
    phone_secondary: data.phoneSecondary || null,
    address_street: data.addressStreet,
    address_city: data.addressCity,
    address_state: data.addressState,
    address_zip: data.addressZip,
    emergency_contact_name: data.emergencyContactName,
    emergency_contact_phone: data.emergencyContactPhone,
    emergency_contact_relationship: data.emergencyContactRelationship,
  };

  const { data: patient, error } = await supabase
    .from('patients')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create patient: ${error.message}`);
  }

  return patient as Patient;
}

export async function createPatientInsurance(
  patientId: string,
  data: InsuranceData,
  type: 'primary' | 'secondary' = 'primary'
): Promise<PatientInsurance> {
  if (data.noInsurance) {
    throw new Error('Cannot create insurance record when no insurance is selected');
  }

  const dbData = {
    patient_id: patientId,
    insurance_type: type,
    carrier_name: data.carrierName,
    policy_number: data.policyNumber || null,
    group_number: data.groupNumber || null,
    subscriber_name: data.subscriberName,
    subscriber_relationship: data.subscriberRelationship || null,
    subscriber_dob: data.subscriberDob || null,
    authorization_number: data.authorizationNumber || null,
  };

  const { data: insurance, error } = await supabase
    .from('patient_insurance')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create insurance: ${error.message}`);
  }

  return insurance as PatientInsurance;
}

export async function createPatientMedicalHistory(
  patientId: string,
  data: MedicalHistoryData
): Promise<PatientMedicalHistory> {
  const dbData = {
    patient_id: patientId,
    chief_complaint: data.chiefComplaint,
    symptom_onset_date: data.symptomOnsetDate,
    symptom_description: data.symptomDescription || null,
    pain_level: data.painLevel,
    current_medications: data.currentMedications || null,
    allergies: data.allergies || null,
    past_surgeries: data.pastSurgeries || null,
    chronic_conditions: data.chronicConditions?.join(', ') || null,
    family_history: data.familyHistory || null,
    injury_date: data.injuryDate || null,
    injury_description: data.injuryDescription || null,
    injury_location: data.injuryLocation || null,
    injury_cause: data.injuryCause || null,
    employer_name: data.employerName || null,
    occupation: data.occupation || null,
    attorney_name: data.attorneyName || null,
    attorney_firm: data.attorneyFirm || null,
    attorney_phone: data.attorneyPhone || null,
    case_number: data.caseNumber || null,
  };

  const { data: history, error } = await supabase
    .from('patient_medical_history')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create medical history: ${error.message}`);
  }

  return history as PatientMedicalHistory;
}

export async function createIntakeSession(
  patientId: string,
  intakeType: 'new_patient' | 'follow_up' | 'reevaluation' = 'new_patient'
): Promise<IntakeSession> {
  const dbData = {
    patient_id: patientId,
    status: 'in_progress',
    intake_type: intakeType,
    device_type: 'ipad',
  };

  const { data: session, error } = await supabase
    .from('intake_sessions')
    .insert(dbData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create intake session: ${error.message}`);
  }

  return session as IntakeSession;
}

export async function completeIntake(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('intake_sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to complete intake: ${error.message}`);
  }
}

export async function findPatientByNameAndDOB(
  lastName: string,
  dateOfBirth: string
): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('last_name', lastName)
    .eq('date_of_birth', dateOfBirth)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to search patient: ${error.message}`);
  }

  return data as Patient;
}
