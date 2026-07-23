// Types générés manuellement à partir de supabase/migrations/0001_init.sql
// (à régénérer avec `supabase gen types typescript` si le schéma évolue).

export type ExerciseType = 'reps_weight' | 'isometric' | 'progression';
export type CalendarStatus = 'planned' | 'done' | 'skipped';
export type SkillKey = 'muscle_up' | 'hspu' | 'l_sit' | 'front_lever' | 'pull_up';

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
        };
        Update: {
          session_name?: string;
          performed_date?: string;
          notes?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
