
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, User } from './AuthContext';

export type Member = {
  id: string;
  email: string;
  displayName: string | null;
  avatarColor: string;
  role: 'owner' | 'admin' | 'member';
};

export type Household = {
  id: string;
  name: string;
  ownerId: string;
  members: Member[];
  createdAt: string;
};

interface HouseholdContextType {
  households: Household[];
  currentHousehold: Household | null;
  createHousehold: (name: string) => Promise<void>;
  switchHousehold: (householdId: string) => void;
  inviteMember: (email: string, householdId: string) => Promise<void>;
  removeMember: (memberId: string, householdId: string) => Promise<void>;
  leaveHousehold: (householdId: string) => Promise<void>;
  updateHousehold: (householdId: string, data: Partial<Household>) => Promise<void>;
  loading: boolean;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}

interface HouseholdProviderProps {
  children: React.ReactNode;
}

export function HouseholdProvider({ children }: HouseholdProviderProps) {
  const { currentUser } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  // Load households when user changes
  useEffect(() => {
    if (currentUser) {
      // In a real app, would fetch from Firebase
      const savedHouseholds = localStorage.getItem(`foodish_households_${currentUser.id}`);
      const savedHouseholdId = localStorage.getItem(`foodish_current_household_${currentUser.id}`);
      
      if (savedHouseholds) {
        const parsedHouseholds: Household[] = JSON.parse(savedHouseholds);
        setHouseholds(parsedHouseholds);
        
        // Set current household
        if (savedHouseholdId && parsedHouseholds.length > 0) {
          const found = parsedHouseholds.find(h => h.id === savedHouseholdId);
          setCurrentHousehold(found || parsedHouseholds[0]);
        } else if (parsedHouseholds.length > 0) {
          setCurrentHousehold(parsedHouseholds[0]);
        }
      } else {
        // Create a default household for new users
        const defaultHousehold: Household = {
          id: Math.random().toString(36).substring(2, 15),
          name: 'My Home',
          ownerId: currentUser.id,
          members: [
            {
              id: currentUser.id,
              email: currentUser.email,
              displayName: currentUser.displayName || 'You',
              avatarColor: currentUser.avatarColor,
              role: 'owner'
            }
          ],
          createdAt: new Date().toISOString()
        };
        
        setHouseholds([defaultHousehold]);
        setCurrentHousehold(defaultHousehold);
        
        // Save to localStorage
        localStorage.setItem(`foodish_households_${currentUser.id}`, JSON.stringify([defaultHousehold]));
        localStorage.setItem(`foodish_current_household_${currentUser.id}`, defaultHousehold.id);
      }
    } else {
      setHouseholds([]);
      setCurrentHousehold(null);
    }
    
    setLoading(false);
  }, [currentUser]);

  // Save households to localStorage when they change
  useEffect(() => {
    if (currentUser && households.length > 0) {
      localStorage.setItem(`foodish_households_${currentUser.id}`, JSON.stringify(households));
    }
  }, [households, currentUser]);

  // Save current household when it changes
  useEffect(() => {
    if (currentUser && currentHousehold) {
      localStorage.setItem(`foodish_current_household_${currentUser.id}`, currentHousehold.id);
    }
  }, [currentHousehold, currentUser]);

  // Create a new household
  async function createHousehold(name: string) {
    if (!currentUser) return;
    
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Check household limit (5)
        const userOwnedHouseholds = households.filter(h => h.ownerId === currentUser.id);
        if (userOwnedHouseholds.length >= 5) {
          setLoading(false);
          reject(new Error('You can only create up to 5 households'));
          return;
        }
        
        const newHousehold: Household = {
          id: Math.random().toString(36).substring(2, 15),
          name,
          ownerId: currentUser.id,
          members: [
            {
              id: currentUser.id,
              email: currentUser.email,
              displayName: currentUser.displayName || 'You',
              avatarColor: currentUser.avatarColor,
              role: 'owner'
            }
          ],
          createdAt: new Date().toISOString()
        };
        
        const updatedHouseholds = [...households, newHousehold];
        setHouseholds(updatedHouseholds);
        setCurrentHousehold(newHousehold);
        setLoading(false);
        resolve();
      }, 1000);
    });
  }

  // Switch to a different household
  function switchHousehold(householdId: string) {
    const household = households.find(h => h.id === householdId);
    if (household) {
      setCurrentHousehold(household);
    }
  }

  // Invite a member to a household
  async function inviteMember(email: string, householdId: string) {
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const householdIndex = households.findIndex(h => h.id === householdId);
        
        if (householdIndex === -1) {
          setLoading(false);
          reject(new Error('Household not found'));
          return;
        }
        
        // Check if member already exists
        if (households[householdIndex].members.some(m => m.email.toLowerCase() === email.toLowerCase())) {
          setLoading(false);
          reject(new Error('User is already a member of this household'));
          return;
        }
        
        // In a real app, would check if user exists in Firebase
        // For now, just add them with mock data
        const newMember: Member = {
          id: Math.random().toString(36).substring(2, 15),
          email: email.toLowerCase(),
          displayName: email.split('@')[0],
          avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16),
          role: 'member'
        };
        
        const updatedHousehold = {
          ...households[householdIndex],
          members: [...households[householdIndex].members, newMember]
        };
        
        const updatedHouseholds = [...households];
        updatedHouseholds[householdIndex] = updatedHousehold;
        
        setHouseholds(updatedHouseholds);
        
        if (currentHousehold?.id === householdId) {
          setCurrentHousehold(updatedHousehold);
        }
        
        setLoading(false);
        resolve();
      }, 1000);
    });
  }

  // Remove a member from a household
  async function removeMember(memberId: string, householdId: string) {
    if (!currentUser) return Promise.reject(new Error('Not authenticated'));
    
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const householdIndex = households.findIndex(h => h.id === householdId);
        
        if (householdIndex === -1) {
          setLoading(false);
          reject(new Error('Household not found'));
          return;
        }
        
        const household = households[householdIndex];
        
        // Check permissions - only owners and admins can remove members
        const currentMember = household.members.find(m => m.id === currentUser.id);
        if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
          setLoading(false);
          reject(new Error('You do not have permission to remove members'));
          return;
        }
        
        // Cannot remove the owner
        const memberToRemove = household.members.find(m => m.id === memberId);
        if (!memberToRemove) {
          setLoading(false);
          reject(new Error('Member not found'));
          return;
        }
        
        if (memberToRemove.role === 'owner') {
          setLoading(false);
          reject(new Error('Cannot remove the owner of the household'));
          return;
        }
        
        const updatedHousehold = {
          ...household,
          members: household.members.filter(m => m.id !== memberId)
        };
        
        const updatedHouseholds = [...households];
        updatedHouseholds[householdIndex] = updatedHousehold;
        
        setHouseholds(updatedHouseholds);
        
        if (currentHousehold?.id === householdId) {
          setCurrentHousehold(updatedHousehold);
        }
        
        setLoading(false);
        resolve();
      }, 1000);
    });
  }

  // Leave a household
  async function leaveHousehold(householdId: string) {
    if (!currentUser) return Promise.reject(new Error('Not authenticated'));
    
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const householdIndex = households.findIndex(h => h.id === householdId);
        
        if (householdIndex === -1) {
          setLoading(false);
          reject(new Error('Household not found'));
          return;
        }
        
        const household = households[householdIndex];
        
        // Cannot leave if you're the owner
        const currentMember = household.members.find(m => m.id === currentUser.id);
        if (!currentMember) {
          setLoading(false);
          reject(new Error('You are not a member of this household'));
          return;
        }
        
        if (currentMember.role === 'owner') {
          setLoading(false);
          reject(new Error('The owner cannot leave the household. Transfer ownership first or delete the household.'));
          return;
        }
        
        // Remove self from household
        const updatedHousehold = {
          ...household,
          members: household.members.filter(m => m.id !== currentUser.id)
        };
        
        const updatedHouseholds = [...households];
        updatedHouseholds[householdIndex] = updatedHousehold;
        
        // Update households list
        setHouseholds(updatedHouseholds);
        
        // If this was the current household, switch to another one
        if (currentHousehold?.id === householdId) {
          const nextHousehold = updatedHouseholds.find(h => h.id !== householdId);
          setCurrentHousehold(nextHousehold || null);
        }
        
        setLoading(false);
        resolve();
      }, 1000);
    });
  }

  // Update household details
  async function updateHousehold(householdId: string, data: Partial<Household>) {
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const householdIndex = households.findIndex(h => h.id === householdId);
        
        if (householdIndex === -1) {
          setLoading(false);
          reject(new Error('Household not found'));
          return;
        }
        
        const updatedHousehold = {
          ...households[householdIndex],
          ...data
        };
        
        const updatedHouseholds = [...households];
        updatedHouseholds[householdIndex] = updatedHousehold;
        
        setHouseholds(updatedHouseholds);
        
        if (currentHousehold?.id === householdId) {
          setCurrentHousehold(updatedHousehold);
        }
        
        setLoading(false);
        resolve();
      }, 1000);
    });
  }

  const value = {
    households,
    currentHousehold,
    createHousehold,
    switchHousehold,
    inviteMember,
    removeMember,
    leaveHousehold,
    updateHousehold,
    loading,
  };

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}
