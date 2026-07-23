// Types générés manuellement à partir de supabase/migrations/0001_init.sql
// (à régénérer avec `supabase gen types typescript` si le schéma évolue).

export type ExerciseType = 'reps_weight' | 'isometric' | 'progression';
export type CalendarStatus = 'planned' | 'done' | 'skipped';
export type SkillKey = 'muscle_up' | 'hspu' | 'l_sit' | 'front_lever' | 'pull_up';

// Système de rangs (v4) : catalogue de skills configurable en base, cf.
// supabase/migrations/0005_skill_ranks.sql.
export type SkillRank = 'iron' | 'bronze' | 'silver' | 'gold' | 'master';
export type SkillCriterionType = 'hold_seconds' | 'reps' | 'variant';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          goals: SkillKey[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          goals?: SkillKey[];
        };
        Update: {
          username?: string | null;
          goals?: SkillKey[];
        };
        Relationships: [];
      };
      programs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      program_sessions: {
        Row: {
          id: string;
          program_id: string;
          user_id: string;
          name: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          user_id: string;
          name: string;
          position?: number;
        };
        Update: {
          name?: string;
          position?: number;
        };
        Relationships: [];
      };
      session_exercises: {
        Row: {
          id: string;
          program_session_id: string;
          user_id: string;
          name: string;
          type: ExerciseType;
          skill_key: SkillKey | null;
          skill_id: string | null;
          position: number;
          target_sets: number;
          target_reps: number | null;
          target_weight_kg: number | null;
          target_hold_seconds: number | null;
          target_rest_seconds: number | null;
          progression_variant: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_session_id: string;
          user_id: string;
          name: string;
          type: ExerciseType;
          skill_key?: SkillKey | null;
          skill_id?: string | null;
          position?: number;
          target_sets?: number;
          target_reps?: number | null;
          target_weight_kg?: number | null;
          target_hold_seconds?: number | null;
          target_rest_seconds?: number | null;
          progression_variant?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          type?: ExerciseType;
          skill_key?: SkillKey | null;
          skill_id?: string | null;
          position?: number;
          target_sets?: number;
          target_reps?: number | null;
          target_weight_kg?: number | null;
          target_hold_seconds?: number | null;
          target_rest_seconds?: number | null;
          progression_variant?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      calendar_entries: {
        Row: {
          id: string;
          user_id: string;
          program_session_id: string;
          scheduled_date: string;
          status: CalendarStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_session_id: string;
          scheduled_date: string;
          status?: CalendarStatus;
        };
        Update: {
          scheduled_date?: string;
          status?: CalendarStatus;
        };
        Relationships: [];
      };
      workout_logs: {
        Row: {
          id: string;
          user_id: string;
          calendar_entry_id: string | null;
          session_name: string;
          performed_date: string;
          notes: string | null;
          rpe: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calendar_entry_id?: string | null;
          session_name: string;
          performed_date?: string;
          notes?: string | null;
          rpe?: number | null;
        };
        Update: {
          session_name?: string;
          performed_date?: string;
          notes?: string | null;
          rpe?: number | null;
        };
        Relationships: [];
      };
      exercise_logs: {
        Row: {
          id: string;
          workout_log_id: string;
          user_id: string;
          session_exercise_id: string | null;
          exercise_name: string;
          type: ExerciseType;
          skill_key: SkillKey | null;
          skill_id: string | null;
          set_number: number;
          reps: number | null;
          weight_kg: number | null;
          hold_seconds: number | null;
          progression_variant: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_log_id: string;
          user_id: string;
          session_exercise_id?: string | null;
          exercise_name: string;
          type: ExerciseType;
          skill_key?: SkillKey | null;
          skill_id?: string | null;
          set_number?: number;
          reps?: number | null;
          weight_kg?: number | null;
          hold_seconds?: number | null;
          progression_variant?: string | null;
        };
        Update: {
          reps?: number | null;
          weight_kg?: number | null;
          hold_seconds?: number | null;
          progression_variant?: string | null;
          set_number?: number;
        };
        Relationships: [];
      };
      progress_photos: {
        Row: {
          id: string;
          user_id: string;
          taken_date: string;
          storage_path: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          taken_date: string;
          storage_path: string;
        };
        Update: {
          taken_date?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description?: string | null;
          position?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          position?: number;
        };
        Relationships: [];
      };
      skill_tiers: {
        Row: {
          id: string;
          skill_id: string;
          rank: SkillRank;
          label: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          rank: SkillRank;
          label: string;
        };
        Update: {
          label?: string;
        };
        Relationships: [];
      };
      skill_tier_criteria: {
        Row: {
          id: string;
          skill_tier_id: string;
          criterion_type: SkillCriterionType;
          threshold: number | null;
          variant_match: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_tier_id: string;
          criterion_type: SkillCriterionType;
          threshold?: number | null;
          variant_match?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      user_skill_progress: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          skill_tier_id: string;
          achieved_at: string;
          exercise_log_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          skill_tier_id: string;
          achieved_at?: string;
          exercise_log_id?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      user_skill_selection: {
        Row: {
          user_id: string;
          skill_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          skill_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
