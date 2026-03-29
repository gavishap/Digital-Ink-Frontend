export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          last_login: string | null
          name: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          last_login?: string | null
          name?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string | null
          role?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      document_pages: {
        Row: {
          annotated_image_path: string | null
          created_at: string | null
          document_id: string
          id: string
          original_image_path: string | null
          page_number: number
          schema_page_id: string | null
        }
        Insert: {
          annotated_image_path?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          original_image_path?: string | null
          page_number: number
          schema_page_id?: string | null
        }
        Update: {
          annotated_image_path?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          original_image_path?: string | null
          page_number?: number
          schema_page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_pages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          id: string
          patient_id: string | null
          status: string | null
          storage_path: string
          total_pages: number | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          patient_id?: string | null
          status?: string | null
          storage_path: string
          total_pages?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          patient_id?: string | null
          status?: string | null
          storage_path?: string
          total_pages?: number | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_edits: {
        Row: {
          edit_reason: string | null
          edited_at: string | null
          edited_by: string
          extraction_result_id: string
          field_id: string
          id: string
          new_value: Json
          old_value: Json | null
        }
        Insert: {
          edit_reason?: string | null
          edited_at?: string | null
          edited_by: string
          extraction_result_id: string
          field_id: string
          id?: string
          new_value: Json
          old_value?: Json | null
        }
        Update: {
          edit_reason?: string | null
          edited_at?: string | null
          edited_by?: string
          extraction_result_id?: string
          field_id?: string
          id?: string
          new_value?: Json
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_edits_extraction_result_id_fkey"
            columns: ["extraction_result_id"]
            isOneToOne: false
            referencedRelation: "extraction_results"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_jobs: {
        Row: {
          ai_model_used: string | null
          completed_at: string | null
          created_at: string | null
          current_stage: string | null
          document_id: string | null
          error_message: string | null
          id: string
          initiated_by: string | null
          percentage: number | null
          processing_time_ms: number | null
          progress: number | null
          started_at: string | null
          status: string
          total_pages: number | null
        }
        Insert: {
          ai_model_used?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_stage?: string | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          percentage?: number | null
          processing_time_ms?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          total_pages?: number | null
        }
        Update: {
          ai_model_used?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_stage?: string | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          percentage?: number | null
          processing_time_ms?: number | null
          progress?: number | null
          started_at?: string | null
          status?: string
          total_pages?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_results: {
        Row: {
          annotation_groups: Json | null
          circled_selections: Json | null
          created_at: string | null
          cross_page_references: Json | null
          document_id: string
          field_values: Json | null
          free_form_annotations: Json | null
          id: string
          items_needing_review: number | null
          job_id: string
          overall_confidence: number | null
          page_number: number
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          spatial_connections: Json | null
          unknown_marks: Json | null
          visual_elements: Json | null
        }
        Insert: {
          annotation_groups?: Json | null
          circled_selections?: Json | null
          created_at?: string | null
          cross_page_references?: Json | null
          document_id: string
          field_values?: Json | null
          free_form_annotations?: Json | null
          id?: string
          items_needing_review?: number | null
          job_id: string
          overall_confidence?: number | null
          page_number: number
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spatial_connections?: Json | null
          unknown_marks?: Json | null
          visual_elements?: Json | null
        }
        Update: {
          annotation_groups?: Json | null
          circled_selections?: Json | null
          created_at?: string | null
          cross_page_references?: Json | null
          document_id?: string
          field_values?: Json | null
          free_form_annotations?: Json | null
          id?: string
          items_needing_review?: number | null
          job_id?: string
          overall_confidence?: number | null
          page_number?: number
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spatial_connections?: Json | null
          unknown_marks?: Json | null
          visual_elements?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "extraction_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          device_type: string | null
          id: string
          intake_type: string | null
          ip_address: unknown
          notes: string | null
          patient_id: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          intake_type?: string | null
          ip_address?: unknown
          notes?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          intake_type?: string | null
          ip_address?: unknown
          notes?: string | null
          patient_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_insurance: {
        Row: {
          authorization_number: string | null
          carrier_name: string
          created_at: string | null
          effective_date: string | null
          expiration_date: string | null
          group_number: string | null
          id: string
          insurance_type: string | null
          patient_id: string | null
          policy_number: string | null
          subscriber_dob: string | null
          subscriber_name: string | null
          subscriber_relationship: string | null
        }
        Insert: {
          authorization_number?: string | null
          carrier_name: string
          created_at?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          group_number?: string | null
          id?: string
          insurance_type?: string | null
          patient_id?: string | null
          policy_number?: string | null
          subscriber_dob?: string | null
          subscriber_name?: string | null
          subscriber_relationship?: string | null
        }
        Update: {
          authorization_number?: string | null
          carrier_name?: string
          created_at?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          group_number?: string | null
          id?: string
          insurance_type?: string | null
          patient_id?: string | null
          policy_number?: string | null
          subscriber_dob?: string | null
          subscriber_name?: string | null
          subscriber_relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_insurance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_medical_history: {
        Row: {
          allergies: string | null
          attorney_firm: string | null
          attorney_name: string | null
          attorney_phone: string | null
          case_number: string | null
          chief_complaint: string | null
          chronic_conditions: string | null
          claim_number: string | null
          claims_admin_address: string | null
          claims_admin_city: string | null
          claims_admin_name: string | null
          claims_admin_phone: string | null
          claims_admin_state: string | null
          claims_admin_zip: string | null
          created_at: string | null
          current_medications: string | null
          employer_address: string | null
          employer_city: string | null
          employer_name: string | null
          employer_state: string | null
          employer_zip: string | null
          family_history: string | null
          id: string
          injury_cause: string | null
          injury_date: string | null
          injury_description: string | null
          injury_location: string | null
          interpreter_language: string | null
          occupation: string | null
          pain_level: number | null
          past_surgeries: string | null
          patient_id: string | null
          symptom_description: string | null
          symptom_onset_date: string | null
          updated_at: string | null
          wcab_venue: string | null
        }
        Insert: {
          allergies?: string | null
          attorney_firm?: string | null
          attorney_name?: string | null
          attorney_phone?: string | null
          case_number?: string | null
          chief_complaint?: string | null
          chronic_conditions?: string | null
          claim_number?: string | null
          claims_admin_address?: string | null
          claims_admin_city?: string | null
          claims_admin_name?: string | null
          claims_admin_phone?: string | null
          claims_admin_state?: string | null
          claims_admin_zip?: string | null
          created_at?: string | null
          current_medications?: string | null
          employer_address?: string | null
          employer_city?: string | null
          employer_name?: string | null
          employer_state?: string | null
          employer_zip?: string | null
          family_history?: string | null
          id?: string
          injury_cause?: string | null
          injury_date?: string | null
          injury_description?: string | null
          injury_location?: string | null
          interpreter_language?: string | null
          occupation?: string | null
          pain_level?: number | null
          past_surgeries?: string | null
          patient_id?: string | null
          symptom_description?: string | null
          symptom_onset_date?: string | null
          updated_at?: string | null
          wcab_venue?: string | null
        }
        Update: {
          allergies?: string | null
          attorney_firm?: string | null
          attorney_name?: string | null
          attorney_phone?: string | null
          case_number?: string | null
          chief_complaint?: string | null
          chronic_conditions?: string | null
          claim_number?: string | null
          claims_admin_address?: string | null
          claims_admin_city?: string | null
          claims_admin_name?: string | null
          claims_admin_phone?: string | null
          claims_admin_state?: string | null
          claims_admin_zip?: string | null
          created_at?: string | null
          current_medications?: string | null
          employer_address?: string | null
          employer_city?: string | null
          employer_name?: string | null
          employer_state?: string | null
          employer_zip?: string | null
          family_history?: string | null
          id?: string
          injury_cause?: string | null
          injury_date?: string | null
          injury_description?: string | null
          injury_location?: string | null
          interpreter_language?: string | null
          occupation?: string | null
          pain_level?: number | null
          past_surgeries?: string | null
          patient_id?: string | null
          symptom_description?: string | null
          symptom_onset_date?: string | null
          updated_at?: string | null
          wcab_venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          created_at: string | null
          date_of_birth: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          middle_name: string | null
          phone_primary: string | null
          phone_secondary: string | null
          ssn_last_four: string | null
          updated_at: string | null
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string | null
          date_of_birth: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          ssn_last_four?: string | null
          updated_at?: string | null
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string | null
          date_of_birth?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          ssn_last_four?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          page_mappings: Json
          template_name: string
          template_storage_path: string | null
          total_pages: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          page_mappings?: Json
          template_name: string
          template_storage_path?: string | null
          total_pages: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          page_mappings?: Json
          template_name?: string
          template_storage_path?: string | null
          total_pages?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          patient_id: string | null
          report_type: string | null
          source_document_ids: string[] | null
          source_extraction_ids: string[] | null
          status: string | null
          storage_path: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          patient_id?: string | null
          report_type?: string | null
          source_document_ids?: string[] | null
          source_extraction_ids?: string[] | null
          status?: string | null
          storage_path?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          patient_id?: string | null
          report_type?: string | null
          source_document_ids?: string[] | null
          source_extraction_ids?: string[] | null
          status?: string | null
          storage_path?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export type Patient = Database["public"]["Tables"]["patients"]["Row"]
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"]
export type PatientInsurance = Database["public"]["Tables"]["patient_insurance"]["Row"]
export type PatientInsuranceInsert = Database["public"]["Tables"]["patient_insurance"]["Insert"]
export type PatientMedicalHistory = Database["public"]["Tables"]["patient_medical_history"]["Row"]
export type PatientMedicalHistoryInsert = Database["public"]["Tables"]["patient_medical_history"]["Insert"]
export type IntakeSession = Database["public"]["Tables"]["intake_sessions"]["Row"]
export type IntakeSessionInsert = Database["public"]["Tables"]["intake_sessions"]["Insert"]
export type AdminProfile = Database["public"]["Tables"]["admin_profiles"]["Row"]

export type DemographicsData = Partial<PatientInsert>
export type InsuranceData = Partial<PatientInsuranceInsert>
export type MedicalHistoryData = Partial<PatientMedicalHistoryInsert>
