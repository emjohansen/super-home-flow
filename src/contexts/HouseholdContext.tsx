import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface HouseholdMember {
  id: string;
  user_id: string;
  role: string;
  displayName?: string;
  email?: string;
  avatar_color?: string;
  // Add an alias for compatibility with existing components
  avatarColor?: string;
}

interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  members: HouseholdMember[];
}

interface HouseholdContextType {
  households: Household[];
  currentHousehold: Household | null;
  loading: boolean;
  setCurrentHousehold: (household: Household | null) => void;
  createHousehold: (name: string) => Promise<Household | null>;
  updateHousehold: (id: string, name: string) => Promise<Household | null>;
  deleteHousehold: (id: string) => Promise<boolean>;
  addMember: (householdId: string, email: string) => Promise<HouseholdMember | null>;
  removeMember: (householdId: string, memberId: string) => Promise<boolean>;
  fetchHouseholds: () => Promise<void>;
  inviteMember: (email: string, householdId: string) => Promise<HouseholdMember | null>;
  switchHousehold: (householdId: string) => void;
}

const HouseholdContext = createContext<HouseholdContextType>({
  households: [],
  currentHousehold: null,
  loading: true,
  setCurrentHousehold: () => {},
  createHousehold: async () => null,
  updateHousehold: async () => null,
  deleteHousehold: async () => false,
  addMember: async () => null,
  removeMember: async () => false,
  fetchHouseholds: async () => {},
  inviteMember: async () => null,
  switchHousehold: () => {},
});

export const useHousehold = () => useContext(HouseholdContext);

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchHouseholds = async () => {
    if (!currentUser) {
      setHouseholds([]);
      setCurrentHousehold(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all households the user is a member of using the new secure function
      const { data: membershipData, error: membershipError } = await supabase
        .rpc('get_user_household_memberships', {
          user_uuid: currentUser.id
        });
      
      if (membershipError) {
        throw membershipError;
      }
      
      if (!membershipData || membershipData.length === 0) {
        setHouseholds([]);
        setCurrentHousehold(null);
        setLoading(false);
        return;
      }
      
      const householdIds = membershipData.map(m => m.household_id);
      
      // Fetch the households
      const { data: householdsData, error: householdsError } = await supabase
        .from('households')
        .select('*')
        .in('id', householdIds);
      
      if (householdsError) throw householdsError;
      
      if (!householdsData) {
        setHouseholds([]);
        setCurrentHousehold(null);
        setLoading(false);
        return;
      }
      
      // For each household, fetch all members
      const fetchedHouseholds: Household[] = await Promise.all(
        householdsData.map(async (household) => {
          // Get membership data
          const { data: members, error: membersError } = await supabase
            .from('household_members')
            .select(`
              id, 
              user_id,
              role
            `)
            .eq('household_id', household.id);
          
          if (membersError) throw membersError;
          
          // Now for each member, get their profile data
          const formattedMembers: HouseholdMember[] = await Promise.all(
            (members || []).map(async (member) => {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('display_name, email, avatar_color')
                .eq('id', member.user_id)
                .maybeSingle();
              
              if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError);
              }
              
              return {
                id: member.id,
                user_id: member.user_id,
                role: member.role,
                displayName: profileData?.display_name || 'Unknown',
                email: profileData?.email,
                avatar_color: profileData?.avatar_color
              };
            })
          );
          
          return {
            ...household,
            members: formattedMembers
          };
        })
      );
      
      setHouseholds(fetchedHouseholds);
      
      // If there's at least one household, set it as current
      if (fetchedHouseholds.length > 0 && !currentHousehold) {
        setCurrentHousehold(fetchedHouseholds[0]);
      } else if (currentHousehold) {
        // Update current household data if it's already set
        const updated = fetchedHouseholds.find(h => h.id === currentHousehold.id);
        if (updated) {
          setCurrentHousehold(updated);
        } else if (fetchedHouseholds.length > 0) {
          // Current household no longer exists, select the first one
          setCurrentHousehold(fetchedHouseholds[0]);
        } else {
          setCurrentHousehold(null);
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching households:', error);
      toast.error(`Failed to fetch households: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch households whenever the user changes
  useEffect(() => {
    fetchHouseholds();
  }, [currentUser]);

  // Function to switch the current household
  const switchHousehold = (householdId: string) => {
    const household = households.find(h => h.id === householdId);
    if (household) {
      setCurrentHousehold(household);
    }
  };

  const createHousehold = async (name: string): Promise<Household | null> => {
    if (!currentUser) return null;
    
    try {
      // Create household
      const { data, error } = await supabase
        .from('households')
        .insert([{ name, created_by: currentUser.id }])
        .select('*')
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      // When we insert a household, the trigger automatically adds the creator as a member,
      // so we need to fetch the member data
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', data.id)
        .eq('user_id', currentUser.id)
        .single();
      
      if (memberError) throw memberError;
      
      const newHousehold: Household = {
        ...data,
        members: [{
          id: memberData.id,
          user_id: memberData.user_id,
          role: memberData.role,
          displayName: currentUser.user_metadata.display_name || currentUser.email || 'Unknown',
          email: currentUser.email
        }]
      };
      
      setHouseholds(prevHouseholds => [...prevHouseholds, newHousehold]);
      setCurrentHousehold(newHousehold);
      toast.success(`Created household "${name}"`);
      
      return newHousehold;
    } catch (error: any) {
      console.error('Error creating household:', error);
      toast.error(`Failed to create household: ${error.message}`);
      return null;
    }
  };

  const updateHousehold = async (id: string, name: string): Promise<Household | null> => {
    if (!currentUser) return null;
    
    try {
      const { data, error } = await supabase
        .from('households')
        .update({ name })
        .eq('id', id)
        .eq('created_by', currentUser.id)  // Only creator can update
        .select('*')
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      const updatedHousehold = households.find(h => h.id === id);
      
      if (updatedHousehold) {
        const updated = { ...updatedHousehold, name };
        
        setHouseholds(prevHouseholds => 
          prevHouseholds.map(h => h.id === id ? updated : h)
        );
        
        if (currentHousehold?.id === id) {
          setCurrentHousehold(updated);
        }
        
        toast.success(`Updated household name to "${name}"`);
        return updated;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error updating household:', error);
      toast.error(`Failed to update household: ${error.message}`);
      return null;
    }
  };

  const deleteHousehold = async (id: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', id)
        .eq('created_by', currentUser.id);  // Only creator can delete
      
      if (error) throw error;
      
      setHouseholds(prevHouseholds => prevHouseholds.filter(h => h.id !== id));
      
      if (currentHousehold?.id === id) {
        // If we deleted the current household, select another one if available
        const nextHousehold = households.find(h => h.id !== id);
        setCurrentHousehold(nextHousehold || null);
      }
      
      toast.success('Household deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting household:', error);
      toast.error(`Failed to delete household: ${error.message}`);
      return false;
    }
  };

  const addMember = async (householdId: string, email: string): Promise<HouseholdMember | null> => {
    if (!currentUser) return null;
    
    try {
      // First find the user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_color')
        .eq('email', email)
        .maybeSingle();
      
      if (userError) {
        if (userError.code === 'PGRST116') {
          toast.error(`No user found with email ${email}`);
          return null;
        }
        throw userError;
      }
      
      if (!userData) {
        toast.error(`No user found with email ${email}`);
        return null;
      }
      
      // Check if the user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', householdId)
        .eq('user_id', userData.id);
      
      if (memberCheckError) throw memberCheckError;
      
      if (existingMember && existingMember.length > 0) {
        toast.info(`${email} is already a member of this household`);
        return null;
      }
      
      // Add the user as a member
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .insert([{
          household_id: householdId,
          user_id: userData.id,
          role: 'member'
        }])
        .select('*')
        .single();
      
      if (memberError) throw memberError;
      
      const avatarColorValue = userData.avatar_color || '#4A9F41';
      
      const newMember: HouseholdMember = {
        id: memberData.id,
        user_id: memberData.user_id,
        role: memberData.role,
        displayName: userData.display_name || email.split('@')[0],
        email: email,
        avatar_color: avatarColorValue,
        avatarColor: avatarColorValue // Add alias for compatibility
      };
      
      // Update the households state
      setHouseholds(prevHouseholds => 
        prevHouseholds.map(h => {
          if (h.id === householdId) {
            return {
              ...h,
              members: [...h.members, newMember]
            };
          }
          return h;
        })
      );
      
      // Update current household if needed
      if (currentHousehold?.id === householdId) {
        setCurrentHousehold({
          ...currentHousehold,
          members: [...currentHousehold.members, newMember]
        });
      }
      
      toast.success(`Added ${email} to household`);
      return newMember;
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(`Failed to add member: ${error.message}`);
      return null;
    }
  };

  const removeMember = async (householdId: string, memberId: string): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      // Update the households state
      setHouseholds(prevHouseholds => 
        prevHouseholds.map(h => {
          if (h.id === householdId) {
            return {
              ...h,
              members: h.members.filter(m => m.id !== memberId)
            };
          }
          return h;
        })
      );
      
      // Update current household if needed
      if (currentHousehold?.id === householdId) {
        setCurrentHousehold({
          ...currentHousehold,
          members: currentHousehold.members.filter(m => m.id !== memberId)
        });
      }
      
      toast.success('Member removed from household');
      return true;
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(`Failed to remove member: ${error.message}`);
      return false;
    }
  };

  // Alias for addMember for compatibility
  const inviteMember = async (email: string, householdId: string): Promise<HouseholdMember | null> => {
    return addMember(householdId, email);
  };

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        loading,
        setCurrentHousehold,
        createHousehold,
        updateHousehold,
        deleteHousehold,
        addMember,
        removeMember,
        fetchHouseholds,
        inviteMember,
        switchHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export default HouseholdContext;
