import { supabase } from "@/integrations/supabase/client";
import { Chore, ChoreHistory, Recurrence, HouseholdMember } from "@/types/chore";

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

  // Transform the data to ensure recurrence is properly typed
  return (data || []).map(chore => ({
    ...chore,
    recurrence: chore.recurrence as Recurrence | undefined
  }));
}

export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  // First, get all household members
  const { data: memberData, error: memberError } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", householdId);

  if (memberError) {
    console.error("Error fetching household members:", memberError);
    throw memberError;
  }

  // Get all member profiles in a separate query
  if (memberData && memberData.length > 0) {
    const userIds = memberData.map(member => member.user_id);
    
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds);
      
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }
    
    // Map profiles to members
    const profilesMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, any>);
    
    // Return members with their profile data
    return memberData.map(member => ({
      ...member,
      display_name: profilesMap[member.user_id]?.display_name || null,
      avatar_color: profilesMap[member.user_id]?.avatar_color || null
    }));
  }
  
  return [];
}

export async function createChore(chore: Omit<Chore, "id" | "created_at" | "updated_at">): Promise<Chore> {
  console.log("Creating chore with data:", chore);
  
  const { data, error } = await supabase.from("chores").insert(chore).select().single();

  if (error) {
    console.error("Error creating chore:", error);
    throw error;
  }

  // Ensure the returned data matches the Chore type
  return {
    ...data,
    recurrence: data.recurrence as Recurrence | undefined
  };
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

  // Ensure the returned data matches the Chore type
  return {
    ...data,
    recurrence: data.recurrence as Recurrence | undefined
  };
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
    
    // If the original chore had a due date, calculate next based on that
    // Otherwise use current date as reference
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
