
import { supabase } from "@/integrations/supabase/client";
import { Chore, ChoreHistory } from "@/types/chore";

export async function getHouseholdChores(householdId: string): Promise<Chore[]> {
  const { data, error } = await supabase
    .from("chores")
    .select("*")
    .eq("household_id", householdId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching chores:", error);
    throw error;
  }

  return data || [];
}

export async function getHouseholdMembers(householdId: string) {
  const { data, error } = await supabase
    .from("household_members")
    .select(`
      id,
      user_id,
      household_id,
      role,
      joined_at,
      profiles:user_id (
        display_name,
        avatar_color
      )
    `)
    .eq("household_id", householdId);

  if (error) {
    console.error("Error fetching household members:", error);
    throw error;
  }

  // Format the returned data to match HouseholdMember interface
  return (data || []).map((member) => ({
    ...member,
    display_name: member.profiles?.display_name,
    avatar_color: member.profiles?.avatar_color,
  }));
}

export async function createChore(chore: Omit<Chore, "id" | "created_at" | "updated_at">): Promise<Chore> {
  const { data, error } = await supabase.from("chores").insert(chore).select().single();

  if (error) {
    console.error("Error creating chore:", error);
    throw error;
  }

  return data;
}

export async function updateChore(id: string, updates: Partial<Chore>): Promise<Chore> {
  const { data, error } = await supabase
    .from("chores")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating chore:", error);
    throw error;
  }

  return data;
}

export async function deleteChore(id: string): Promise<void> {
  const { error } = await supabase.from("chores").delete().eq("id", id);

  if (error) {
    console.error("Error deleting chore:", error);
    throw error;
  }
}

export async function completeChore(chore: Chore, userId: string): Promise<void> {
  const now = new Date().toISOString();

  // First mark the chore as completed
  const { error: updateError } = await supabase
    .from("chores")
    .update({
      completed: true,
      completion_date: now,
    })
    .eq("id", chore.id);

  if (updateError) {
    console.error("Error completing chore:", updateError);
    throw updateError;
  }

  // Then create a history record
  const historyEntry: Omit<ChoreHistory, "id"> = {
    chore_id: chore.id,
    completed_by: userId,
    completed_at: now,
    household_id: chore.household_id,
    notes: `Completed by user ${userId}`,
  };

  const { error: historyError } = await supabase.from("chore_history").insert(historyEntry);

  if (historyError) {
    console.error("Error creating chore history:", historyError);
    throw historyError;
  }

  // If it's a recurring chore, create the next occurrence
  if (chore.recurrence && chore.recurrence !== "once") {
    let nextDueDate: Date | null = null;
    const dueDate = chore.due_date ? new Date(chore.due_date) : new Date();

    switch (chore.recurrence) {
      case "daily":
        nextDueDate = new Date(dueDate);
        nextDueDate.setDate(nextDueDate.getDate() + 1);
        break;
      case "weekly":
        nextDueDate = new Date(dueDate);
        nextDueDate.setDate(nextDueDate.getDate() + 7);
        break;
      case "biweekly":
        nextDueDate = new Date(dueDate);
        nextDueDate.setDate(nextDueDate.getDate() + 14);
        break;
      case "monthly":
        nextDueDate = new Date(dueDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
    }

    if (nextDueDate) {
      // Call the database function to create the next recurring chore
      const { error: recurrenceError } = await supabase.rpc(
        "create_recurring_chore",
        {
          p_chore_id: chore.id,
          p_next_due_date: nextDueDate.toISOString(),
        }
      );

      if (recurrenceError) {
        console.error("Error creating recurring chore:", recurrenceError);
        throw recurrenceError;
      }
    }
  }
}

export async function getChoreHistory(householdId: string): Promise<ChoreHistory[]> {
  const { data, error } = await supabase
    .from("chore_history")
    .select("*")
    .eq("household_id", householdId)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("Error fetching chore history:", error);
    throw error;
  }

  return data || [];
}
