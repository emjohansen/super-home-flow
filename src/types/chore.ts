
export type Recurrence = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Chore {
  id: string;
  household_id: string;
  name: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  recurrence?: Recurrence;
  completed?: boolean;
  completion_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  difficulty?: number;
  estimated_minutes?: number;
}

export interface ChoreHistory {
  id: string;
  chore_id: string;
  completed_by: string;
  completed_at: string;
  household_id: string;
  notes?: string;
}

export interface HouseholdMember {
  id: string;
  user_id: string;
  household_id: string;
  role: string;
  joined_at: string;
  display_name?: string;
  avatar_color?: string;
}
