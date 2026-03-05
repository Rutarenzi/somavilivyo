export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      adaptive_content_adjustments: {
        Row: {
          adjusted_value: Json | null
          adjustment_type: string
          ai_confidence: number | null
          course_id: string
          created_at: string | null
          effectiveness_score: number | null
          id: string
          micro_module_id: string
          original_value: Json | null
          reason: string | null
          user_feedback: string | null
          user_id: string
        }
        Insert: {
          adjusted_value?: Json | null
          adjustment_type: string
          ai_confidence?: number | null
          course_id: string
          created_at?: string | null
          effectiveness_score?: number | null
          id?: string
          micro_module_id: string
          original_value?: Json | null
          reason?: string | null
          user_feedback?: string | null
          user_id: string
        }
        Update: {
          adjusted_value?: Json | null
          adjustment_type?: string
          ai_confidence?: number | null
          course_id?: string
          created_at?: string | null
          effectiveness_score?: number | null
          id?: string
          micro_module_id?: string
          original_value?: Json | null
          reason?: string | null
          user_feedback?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          message_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          edited: boolean
          id: string
          order_index: number
          quiz_data: Json | null
          role: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          edited?: boolean
          id?: string
          order_index: number
          quiz_data?: Json | null
          role: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          edited?: boolean
          id?: string
          order_index?: number
          quiz_data?: Json | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string
          context: string | null
          course_id: string | null
          created_at: string | null
          id: string
          is_bot: boolean
          user_id: string
        }
        Insert: {
          content: string
          context?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_bot?: boolean
          user_id: string
        }
        Update: {
          content?: string
          context?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_bot?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "chat_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      competency_tracking: {
        Row: {
          competency_name: string
          course_id: string
          created_at: string | null
          current_level: string | null
          evidence_points: Json | null
          id: string
          improvement_suggestions: Json | null
          last_assessed_at: string | null
          mastery_percentage: number | null
          skill_gaps: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          competency_name: string
          course_id: string
          created_at?: string | null
          current_level?: string | null
          evidence_points?: Json | null
          id?: string
          improvement_suggestions?: Json | null
          last_assessed_at?: string | null
          mastery_percentage?: number | null
          skill_gaps?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          competency_name?: string
          course_id?: string
          created_at?: string | null
          current_level?: string | null
          evidence_points?: Json | null
          id?: string
          improvement_suggestions?: Json | null
          last_assessed_at?: string | null
          mastery_percentage?: number | null
          skill_gaps?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          education_system_type: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          education_system_type: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          education_system_type?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      course_invitations: {
        Row: {
          course_id: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          message: string | null
          status: string
        }
        Insert: {
          course_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          message?: string | null
          status?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_invitations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_invitations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quality_summary: {
        Row: {
          average_quality_score: number
          content_completeness_percentage: number
          course_id: string
          created_at: string
          id: string
          last_full_validation_at: string | null
          modules_needing_enhancement: number
          overall_quality_status: string
          quality_passed_modules: number
          total_modules: number
          updated_at: string
          validated_modules: number
        }
        Insert: {
          average_quality_score?: number
          content_completeness_percentage?: number
          course_id: string
          created_at?: string
          id?: string
          last_full_validation_at?: string | null
          modules_needing_enhancement?: number
          overall_quality_status?: string
          quality_passed_modules?: number
          total_modules?: number
          updated_at?: string
          validated_modules?: number
        }
        Update: {
          average_quality_score?: number
          content_completeness_percentage?: number
          course_id?: string
          created_at?: string
          id?: string
          last_full_validation_at?: string | null
          modules_needing_enhancement?: number
          overall_quality_status?: string
          quality_passed_modules?: number
          total_modules?: number
          updated_at?: string
          validated_modules?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_quality_summary_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_quality_summary_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sections: {
        Row: {
          content: string
          content_type: string | null
          created_at: string | null
          estimated_time_minutes: number | null
          id: string
          order_index: number
          title: string
          topic_id: string
        }
        Insert: {
          content: string
          content_type?: string | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          id?: string
          order_index: number
          title: string
          topic_id: string
        }
        Update: {
          content?: string
          content_type?: string | null
          created_at?: string | null
          estimated_time_minutes?: number | null
          id?: string
          order_index?: number
          title?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "course_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      course_topics: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          subtopics: Json
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index: number
          subtopics?: Json
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          subtopics?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty_level: string
          estimated_duration: string | null
          id: string
          is_template_course: boolean | null
          learning_preferences: Json
          school_id: string | null
          skill_area: string
          status: string | null
          template_course_id: string | null
          title: string
          topics: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level: string
          estimated_duration?: string | null
          id?: string
          is_template_course?: boolean | null
          learning_preferences?: Json
          school_id?: string | null
          skill_area: string
          status?: string | null
          template_course_id?: string | null
          title: string
          topics?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: string
          estimated_duration?: string | null
          id?: string
          is_template_course?: boolean | null
          learning_preferences?: Json
          school_id?: string | null
          skill_area?: string
          status?: string | null
          template_course_id?: string | null
          title?: string
          topics?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_template_course_id_fkey"
            columns: ["template_course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "courses_template_course_id_fkey"
            columns: ["template_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_content: {
        Row: {
          content_metadata: Json | null
          content_source: string | null
          content_text: string
          content_type: string
          created_at: string | null
          id: string
          page_reference: string | null
          pdf_file_path: string | null
          source_document: string | null
          subtopic_id: string | null
          title: string
        }
        Insert: {
          content_metadata?: Json | null
          content_source?: string | null
          content_text: string
          content_type: string
          created_at?: string | null
          id?: string
          page_reference?: string | null
          pdf_file_path?: string | null
          source_document?: string | null
          subtopic_id?: string | null
          title: string
        }
        Update: {
          content_metadata?: Json | null
          content_source?: string | null
          content_text?: string
          content_type?: string
          created_at?: string | null
          id?: string
          page_reference?: string | null
          pdf_file_path?: string | null
          source_document?: string | null
          subtopic_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_content_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_embeddings: {
        Row: {
          chunk_index: number | null
          content_chunk: string
          content_id: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          subtopic_id: string | null
        }
        Insert: {
          chunk_index?: number | null
          content_chunk: string
          content_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          subtopic_id?: string | null
        }
        Update: {
          chunk_index?: number | null
          content_chunk?: string
          content_id?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          subtopic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_embeddings_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "curriculum_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_embeddings_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_relationships: {
        Row: {
          created_at: string | null
          id: string
          relationship_type: string
          source_subtopic_id: string | null
          strength_score: number | null
          target_subtopic_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_type: string
          source_subtopic_id?: string | null
          strength_score?: number | null
          target_subtopic_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_type?: string
          source_subtopic_id?: string | null
          strength_score?: number | null
          target_subtopic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_relationships_source_subtopic_id_fkey"
            columns: ["source_subtopic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_subtopics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_relationships_target_subtopic_id_fkey"
            columns: ["target_subtopic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_subtopics"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_subtopics: {
        Row: {
          assessment_methods: Json | null
          bloom_taxonomy_level: string | null
          competency_indicators: Json | null
          created_at: string | null
          id: string
          learning_objective: string
          subtopic_code: string
          subtopic_description: string | null
          subtopic_order: number
          subtopic_title: string
          suggested_activities: Json | null
          topic_id: string | null
        }
        Insert: {
          assessment_methods?: Json | null
          bloom_taxonomy_level?: string | null
          competency_indicators?: Json | null
          created_at?: string | null
          id?: string
          learning_objective: string
          subtopic_code: string
          subtopic_description?: string | null
          subtopic_order: number
          subtopic_title: string
          suggested_activities?: Json | null
          topic_id?: string | null
        }
        Update: {
          assessment_methods?: Json | null
          bloom_taxonomy_level?: string | null
          competency_indicators?: Json | null
          created_at?: string | null
          id?: string
          learning_objective?: string
          subtopic_code?: string
          subtopic_description?: string | null
          subtopic_order?: number
          subtopic_title?: string
          suggested_activities?: Json | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_subtopics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_topics: {
        Row: {
          created_at: string | null
          difficulty_level: string | null
          duration_hours: number | null
          id: string
          prerequisites: Json | null
          topic_code: string
          topic_description: string | null
          topic_order: number
          topic_title: string
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          id?: string
          prerequisites?: Json | null
          topic_code: string
          topic_description?: string | null
          topic_order: number
          topic_title: string
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          id?: string
          prerequisites?: Json | null
          topic_code?: string
          topic_description?: string | null
          topic_order?: number
          topic_title?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_topics_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "curriculum_units"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_units: {
        Row: {
          assessment_criteria: Json | null
          created_at: string | null
          duration_weeks: number | null
          id: string
          learning_outcomes: Json | null
          level_subject_id: string | null
          unit_code: string
          unit_description: string | null
          unit_order: number
          unit_title: string
        }
        Insert: {
          assessment_criteria?: Json | null
          created_at?: string | null
          duration_weeks?: number | null
          id?: string
          learning_outcomes?: Json | null
          level_subject_id?: string | null
          unit_code: string
          unit_description?: string | null
          unit_order: number
          unit_title: string
        }
        Update: {
          assessment_criteria?: Json | null
          created_at?: string | null
          duration_weeks?: number | null
          id?: string
          learning_outcomes?: Json | null
          level_subject_id?: string | null
          unit_code?: string
          unit_description?: string | null
          unit_order?: number
          unit_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_units_level_subject_id_fkey"
            columns: ["level_subject_id"]
            isOneToOne: false
            referencedRelation: "level_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      education_levels: {
        Row: {
          age_range: string | null
          country_id: string | null
          created_at: string | null
          description: string | null
          duration_years: number | null
          id: string
          is_compulsory: boolean | null
          level_category: string
          level_code: string
          level_name: string
        }
        Insert: {
          age_range?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_years?: number | null
          id?: string
          is_compulsory?: boolean | null
          level_category: string
          level_code: string
          level_name: string
        }
        Update: {
          age_range?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_years?: number | null
          id?: string
          is_compulsory?: boolean | null
          level_category?: string
          level_code?: string
          level_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_levels_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      enhanced_learning_analytics: {
        Row: {
          attention_span_minutes: number | null
          confidence_ratings: Json | null
          course_id: string
          created_at: string | null
          help_seeking_events: Json | null
          id: string
          interaction_patterns: Json | null
          micro_module_id: string
          optimal_learning_time: string | null
          reading_patterns: Json | null
          scroll_behavior: Json | null
          session_id: string
          struggle_indicators: Json | null
          time_spent_sections: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attention_span_minutes?: number | null
          confidence_ratings?: Json | null
          course_id: string
          created_at?: string | null
          help_seeking_events?: Json | null
          id?: string
          interaction_patterns?: Json | null
          micro_module_id: string
          optimal_learning_time?: string | null
          reading_patterns?: Json | null
          scroll_behavior?: Json | null
          session_id?: string
          struggle_indicators?: Json | null
          time_spent_sections?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attention_span_minutes?: number | null
          confidence_ratings?: Json | null
          course_id?: string
          created_at?: string | null
          help_seeking_events?: Json | null
          id?: string
          interaction_patterns?: Json | null
          micro_module_id?: string
          optimal_learning_time?: string | null
          reading_patterns?: Json | null
          scroll_behavior?: Json | null
          session_id?: string
          struggle_indicators?: Json | null
          time_spent_sections?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_ui_components: {
        Row: {
          component_identifier: string
          created_at: string | null
          generated_code: string
          generation_successful: boolean
          id: string
          preferences_hash: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          component_identifier: string
          created_at?: string | null
          generated_code: string
          generation_successful?: boolean
          id?: string
          preferences_hash: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          component_identifier?: string
          created_at?: string | null
          generated_code?: string
          generation_successful?: boolean
          id?: string
          preferences_hash?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generation_sessions: {
        Row: {
          api_keys_used: number | null
          cancelled_at: string | null
          completed_at: string | null
          course_id: string | null
          created_at: string
          current_phase: number
          error_message: string | null
          form_data: Json
          id: string
          last_activity: string
          metadata: Json | null
          phases_data: Json
          session_token: string
          started_at: string
          status: string
          total_phases: number
          updated_at: string
          user_id: string
        }
        Insert: {
          api_keys_used?: number | null
          cancelled_at?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          current_phase?: number
          error_message?: string | null
          form_data?: Json
          id?: string
          last_activity?: string
          metadata?: Json | null
          phases_data?: Json
          session_token?: string
          started_at?: string
          status?: string
          total_phases?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          api_keys_used?: number | null
          cancelled_at?: string | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string
          current_phase?: number
          error_message?: string | null
          form_data?: Json
          id?: string
          last_activity?: string
          metadata?: Json | null
          phases_data?: Json
          session_token?: string
          started_at?: string
          status?: string
          total_phases?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "generation_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_analytics: {
        Row: {
          comprehension_indicators: Json | null
          course_id: string
          created_at: string | null
          engagement_score: number | null
          id: string
          interaction_count: number | null
          micro_module_id: string
          pause_count: number | null
          reading_time_seconds: number | null
          replay_count: number | null
          scroll_progress: number | null
          session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comprehension_indicators?: Json | null
          course_id: string
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          interaction_count?: number | null
          micro_module_id: string
          pause_count?: number | null
          reading_time_seconds?: number | null
          replay_count?: number | null
          scroll_progress?: number | null
          session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comprehension_indicators?: Json | null
          course_id?: string
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          interaction_count?: number | null
          micro_module_id?: string
          pause_count?: number | null
          reading_time_seconds?: number | null
          replay_count?: number | null
          scroll_progress?: number | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_insights: {
        Row: {
          action_items: Json | null
          confidence_score: number | null
          course_id: string
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_active: boolean | null
          priority: number | null
          title: string
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          confidence_score?: number | null
          course_id: string
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_active?: boolean | null
          priority?: number | null
          title: string
          user_id: string
        }
        Update: {
          action_items?: Json | null
          confidence_score?: number | null
          course_id?: string
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_active?: boolean | null
          priority?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_patterns: {
        Row: {
          confidence_level: number | null
          detected_at: string | null
          id: string
          is_current: boolean | null
          pattern_data: Json
          pattern_type: string
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          detected_at?: string | null
          id?: string
          is_current?: boolean | null
          pattern_data: Json
          pattern_type: string
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          detected_at?: string | null
          id?: string
          is_current?: boolean | null
          pattern_data?: Json
          pattern_type?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: Json | null
          confidence_score: number | null
          course_id: string
          created_at: string | null
          expires_at: string | null
          factors_considered: Json | null
          id: string
          predicted_value: Json
          prediction_horizon: string | null
          prediction_type: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number | null
          course_id: string
          created_at?: string | null
          expires_at?: string | null
          factors_considered?: Json | null
          id?: string
          predicted_value: Json
          prediction_horizon?: string | null
          prediction_type: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number | null
          course_id?: string
          created_at?: string | null
          expires_at?: string | null
          factors_considered?: Json | null
          id?: string
          predicted_value?: Json
          prediction_horizon?: string | null
          prediction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_style_profiles: {
        Row: {
          confidence_score: number | null
          content_preferences: Json | null
          created_at: string | null
          detected_patterns: Json | null
          difficulty_preference: string | null
          id: string
          last_updated: string | null
          learning_style_scores: Json | null
          optimal_session_duration: number | null
          pacing_preference: string | null
          preferred_learning_times: Json | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content_preferences?: Json | null
          created_at?: string | null
          detected_patterns?: Json | null
          difficulty_preference?: string | null
          id?: string
          last_updated?: string | null
          learning_style_scores?: Json | null
          optimal_session_duration?: number | null
          pacing_preference?: string | null
          preferred_learning_times?: Json | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content_preferences?: Json | null
          created_at?: string | null
          detected_patterns?: Json | null
          difficulty_preference?: string | null
          id?: string
          last_updated?: string | null
          learning_style_scores?: Json | null
          optimal_session_duration?: number | null
          pacing_preference?: string | null
          preferred_learning_times?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      level_subjects: {
        Row: {
          assessment_type: string | null
          created_at: string | null
          education_level_id: string | null
          hours_per_year: number | null
          id: string
          is_core: boolean | null
          subject_id: string | null
        }
        Insert: {
          assessment_type?: string | null
          created_at?: string | null
          education_level_id?: string | null
          hours_per_year?: number | null
          id?: string
          is_core?: boolean | null
          subject_id?: string | null
        }
        Update: {
          assessment_type?: string | null
          created_at?: string | null
          education_level_id?: string | null
          hours_per_year?: number | null
          id?: string
          is_core?: boolean | null
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "level_subjects_education_level_id_fkey"
            columns: ["education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "level_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_modules: {
        Row: {
          content: string
          course_id: string
          created_at: string | null
          estimated_duration_minutes: number | null
          generated_code: string | null
          id: string
          learning_objective: string
          module_index: number
          prerequisites: Json | null
          quick_quiz: Json | null
          subtopic_id: string
          subtopic_index: number
          title: string
          topic_index: number
          updated_at: string | null
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string | null
          estimated_duration_minutes?: number | null
          generated_code?: string | null
          id?: string
          learning_objective: string
          module_index: number
          prerequisites?: Json | null
          quick_quiz?: Json | null
          subtopic_id: string
          subtopic_index: number
          title: string
          topic_index: number
          updated_at?: string | null
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string | null
          estimated_duration_minutes?: number | null
          generated_code?: string | null
          id?: string
          learning_objective?: string
          module_index?: number
          prerequisites?: Json | null
          quick_quiz?: Json | null
          subtopic_id?: string
          subtopic_index?: number
          title?: string
          topic_index?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "micro_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "micro_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      module_quality_metrics: {
        Row: {
          content_diversity_score: number
          content_length: number
          course_id: string
          created_at: string
          enhancement_attempted: boolean
          has_examples: boolean
          has_introduction: boolean
          has_main_content: boolean
          has_quiz: boolean
          has_summary: boolean
          id: string
          last_validated_at: string
          module_id: string
          needs_enhancement: boolean
          quality_score: number
          structural_completeness: number
          updated_at: string
          validation_status: string
        }
        Insert: {
          content_diversity_score?: number
          content_length?: number
          course_id: string
          created_at?: string
          enhancement_attempted?: boolean
          has_examples?: boolean
          has_introduction?: boolean
          has_main_content?: boolean
          has_quiz?: boolean
          has_summary?: boolean
          id?: string
          last_validated_at?: string
          module_id: string
          needs_enhancement?: boolean
          quality_score?: number
          structural_completeness?: number
          updated_at?: string
          validation_status?: string
        }
        Update: {
          content_diversity_score?: number
          content_length?: number
          course_id?: string
          created_at?: string
          enhancement_attempted?: boolean
          has_examples?: boolean
          has_introduction?: boolean
          has_main_content?: boolean
          has_quiz?: boolean
          has_summary?: boolean
          id?: string
          last_validated_at?: string
          module_id?: string
          needs_enhancement?: boolean
          quality_score?: number
          structural_completeness?: number
          updated_at?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_quality_metrics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "module_quality_metrics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_quality_metrics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "module_quality_metrics_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "micro_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_question_cache: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          module_id: string
          preferences_hash: string
          question_count: number
          questions_json: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          module_id: string
          preferences_hash: string
          question_count: number
          questions_json: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          module_id?: string
          preferences_hash?: string
          question_count?: number
          questions_json?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          external_id: string
          id: string
          phone: string
          provider: string
          provider_payload: Json | null
          reference_id: string
          status: string
          updated_at: string | null
          user_id: string | null
          webhook_verified: boolean | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          external_id: string
          id?: string
          phone: string
          provider: string
          provider_payload?: Json | null
          reference_id: string
          status: string
          updated_at?: string | null
          user_id?: string | null
          webhook_verified?: boolean | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          external_id?: string
          id?: string
          phone?: string
          provider?: string
          provider_payload?: Json | null
          reference_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
          webhook_verified?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_id: string | null
          created_at: string | null
          current_education_level_id: string | null
          curriculum_preferences: Json | null
          email: string | null
          first_login: boolean | null
          full_name: string | null
          id: string
          learner_type: string | null
          learning_goals: Json | null
          learning_preferences: Json | null
          onboarding_completed: boolean | null
          preferred_subjects: Json | null
          preset_password: string | null
          school_id: string | null
          subscription_expires_at: string | null
          subscription_plan_id: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          country_id?: string | null
          created_at?: string | null
          current_education_level_id?: string | null
          curriculum_preferences?: Json | null
          email?: string | null
          first_login?: boolean | null
          full_name?: string | null
          id: string
          learner_type?: string | null
          learning_goals?: Json | null
          learning_preferences?: Json | null
          onboarding_completed?: boolean | null
          preferred_subjects?: Json | null
          preset_password?: string | null
          school_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          country_id?: string | null
          created_at?: string | null
          current_education_level_id?: string | null
          curriculum_preferences?: Json | null
          email?: string | null
          first_login?: boolean | null
          full_name?: string | null
          id?: string
          learner_type?: string | null
          learning_goals?: Json | null
          learning_preferences?: Json | null
          onboarding_completed?: boolean | null
          preferred_subjects?: Json | null
          preset_password?: string | null
          school_id?: string | null
          subscription_expires_at?: string | null
          subscription_plan_id?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_current_education_level_id_fkey"
            columns: ["current_education_level_id"]
            isOneToOne: false
            referencedRelation: "education_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_subscription_plan_id_fkey"
            columns: ["subscription_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      question_sets: {
        Row: {
          course_id: string
          created_at: string
          generated_questions: Json
          generation_preferences: Json
          id: string
          selected_course_title: string | null
          selected_module_ids: string[] | null
          selected_topics_json: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          generated_questions: Json
          generation_preferences: Json
          id?: string
          selected_course_title?: string | null
          selected_module_ids?: string[] | null
          selected_topics_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          generated_questions?: Json
          generation_preferences?: Json
          id?: string
          selected_course_title?: string | null
          selected_module_ids?: string[] | null
          selected_topics_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_sets_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "question_sets_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_course_access: {
        Row: {
          access_level: string
          course_id: string
          granted_at: string
          granted_by: string
          id: string
          user_id: string
        }
        Insert: {
          access_level?: string
          course_id: string
          granted_at?: string
          granted_by: string
          id?: string
          user_id: string
        }
        Update: {
          access_level?: string
          course_id?: string
          granted_at?: string
          granted_by?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "shared_course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          country_id: string | null
          created_at: string | null
          hours_per_week: number | null
          id: string
          is_examinable: boolean | null
          subject_category: string | null
          subject_code: string
          subject_name: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string | null
          hours_per_week?: number | null
          id?: string
          is_examinable?: boolean | null
          subject_category?: string | null
          subject_code: string
          subject_name: string
        }
        Update: {
          country_id?: string | null
          created_at?: string | null
          hours_per_week?: number | null
          id?: string
          is_examinable?: boolean | null
          subject_category?: string | null
          subject_code?: string
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          monthly_token_limit: number
          name: string
          price_monthly: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_token_limit: number
          name: string
          price_monthly?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_token_limit?: number
          name?: string
          price_monthly?: number
        }
        Relationships: []
      }
      user_curriculum_progress: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          mastery_level: string | null
          subtopic_id: string | null
          user_id: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          mastery_level?: string | null
          subtopic_id?: string | null
          user_id?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          mastery_level?: string | null
          subtopic_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_curriculum_progress_subtopic_id_fkey"
            columns: ["subtopic_id"]
            isOneToOne: false
            referencedRelation: "curriculum_subtopics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_micro_progress: {
        Row: {
          attempts: number | null
          completed_at: string | null
          confusion_points: Json | null
          course_id: string
          created_at: string | null
          difficulty_rating: number | null
          help_requests: number | null
          id: string
          learning_velocity: number | null
          mastery_level: number | null
          micro_module_id: string
          optimal_study_time: string | null
          quiz_score: number | null
          review_scheduled_at: string | null
          time_spent_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          confusion_points?: Json | null
          course_id: string
          created_at?: string | null
          difficulty_rating?: number | null
          help_requests?: number | null
          id?: string
          learning_velocity?: number | null
          mastery_level?: number | null
          micro_module_id: string
          optimal_study_time?: string | null
          quiz_score?: number | null
          review_scheduled_at?: string | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          confusion_points?: Json | null
          course_id?: string
          created_at?: string | null
          difficulty_rating?: number | null
          help_requests?: number | null
          id?: string
          learning_velocity?: number | null
          mastery_level?: number | null
          micro_module_id?: string
          optimal_study_time?: string | null
          quiz_score?: number | null
          review_scheduled_at?: string | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_micro_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_micro_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_micro_progress_micro_module_id_fkey"
            columns: ["micro_module_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "user_micro_progress_micro_module_id_fkey"
            columns: ["micro_module_id"]
            isOneToOne: false
            referencedRelation: "micro_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          last_accessed: string | null
          progress_percentage: number | null
          section_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          last_accessed?: string | null
          progress_percentage?: number | null
          section_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          last_accessed?: string | null
          progress_percentage?: number | null
          section_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_token_usage: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          operation_type: string
          session_id: string | null
          tokens_used: number
          updated_at: string | null
          usage_month: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          operation_type: string
          session_id?: string | null
          tokens_used?: number
          updated_at?: string | null
          usage_month: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          session_id?: string | null
          tokens_used?: number
          updated_at?: string | null
          usage_month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_token_usage_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_module_overview"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "user_token_usage_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          institution_name: string | null
          interests: Json | null
          referral_source: string | null
          student_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          institution_name?: string | null
          interests?: Json | null
          referral_source?: string | null
          student_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          institution_name?: string | null
          interests?: Json | null
          referral_source?: string | null
          student_type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      course_module_overview: {
        Row: {
          course_created_at: string | null
          course_description: string | null
          course_id: string | null
          course_status: string | null
          course_title: string | null
          difficulty_level: string | null
          estimated_duration_minutes: number | null
          is_completed: boolean | null
          learning_objective: string | null
          mastery_level: number | null
          module_created_at: string | null
          module_id: string | null
          module_index: number | null
          module_title: string | null
          quiz_score: number | null
          skill_area: string | null
          subtopic_id: string | null
          subtopic_index: number | null
          topic_index: number | null
          topics: Json | null
          user_id: string | null
        }
        Relationships: []
      }
      user_monthly_token_summary: {
        Row: {
          operations_breakdown: Json | null
          total_operations: number | null
          total_tokens_used: number | null
          usage_month: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_template_courses_to_user: {
        Args: { target_user_id: string }
        Returns: number
      }
      cancel_old_generation_sessions: { Args: never; Returns: number }
      check_token_limit: {
        Args: { required_tokens: number; target_user_id: string }
        Returns: boolean
      }
      clean_corrupted_json: { Args: never; Returns: number }
      cleanup_empty_conversations: { Args: never; Returns: number }
      cleanup_old_sessions: { Args: never; Returns: number }
      cleanup_orphaned_records: { Args: never; Returns: number }
      duplicate_template_course: {
        Args: { target_user_id: string; template_id: string }
        Returns: string
      }
      get_conversation_message_stats: {
        Args: { target_user_id: string }
        Returns: {
          conversation_id: string
          last_message_at: string
          message_count: number
        }[]
      }
      get_optimized_course_data: {
        Args: { course_id_param: string; user_id_param: string }
        Returns: Json
      }
      get_user_token_usage: {
        Args: { target_user_id: string }
        Returns: {
          current_month_usage: number
          monthly_limit: number
          percentage_used: number
          plan_name: string
          tokens_remaining: number
        }[]
      }
      log_token_usage: {
        Args: {
          extra_metadata?: Json
          operation: string
          target_course_id?: string
          target_session_id?: string
          target_user_id: string
          tokens: number
        }
        Returns: boolean
      }
      validate_json_column: { Args: { json_data: Json }; Returns: boolean }
    }
    Enums: {
      action_item_status: "pending" | "in_progress" | "completed"
      meeting_status_new: "scheduled" | "active" | "ended" | "cancelled"
      vote_type: "yes_no" | "multiple_choice" | "rating"
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

export const Constants = {
  public: {
    Enums: {
      action_item_status: ["pending", "in_progress", "completed"],
      meeting_status_new: ["scheduled", "active", "ended", "cancelled"],
      vote_type: ["yes_no", "multiple_choice", "rating"],
    },
  },
} as const
