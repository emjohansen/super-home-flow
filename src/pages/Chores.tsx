
import React, { useState, useEffect, useMemo } from 'react';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useAuth } from '@/contexts/AuthContext';
import { Chore, ChoreHistory as ChoreHistoryType, HouseholdMember } from '@/types/chore';
import {
  getHouseholdChores,
  getHouseholdMembers,
  createChore,
  updateChore,
  getChoreHistory
} from '@/services/choreService';
import { isPast, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PlusCircle, X } from 'lucide-react';

import { ChoreCard } from '@/components/chores/ChoreCard';
import { ChoreForm } from '@/components/chores/ChoreForm';
import { ChoreStatistics } from '@/components/chores/ChoreStatistics';
import { ChoreHistory } from '@/components/chores/ChoreHistory';
import { ChoreFilters, ChoreFilterOptions } from '@/components/chores/ChoreFilters';
import { CollapsibleSection } from '@/components/chores/CollapsibleSection';
import { TimePeriod } from '@/components/chores/PeriodToggle';

const Chores: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentHousehold } = useHousehold();
  
  const [chores, setChores] = useState<Chore[]>([]);
  const [pendingChores, setPendingChores] = useState<Chore[]>([]);
  const [completedChores, setCompletedChores] = useState<Chore[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [choreHistory, setChoreHistory] = useState<ChoreHistoryType[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeChore, setActiveChore] = useState<Chore | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [customDate, setCustomDate] = useState<Date | null>(null);
  
  const [filters, setFilters] = useState<ChoreFilterOptions>({
    status: 'all',
    assignee: '',
    sortBy: 'dueDate',
    searchQuery: '',
  });

  const periodRange = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    // Set the start and end date based on the selected period
    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case '14-days':
        startDate = addDays(startOfDay(now), -14);
        endDate = now;
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'custom':
        startDate = customDate;
        endDate = now;
        break;
      case 'all':
        // No start date for all time
        startDate = null;
        endDate = null;
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    }
    
    return { startDate, endDate, now };
  }, [period, customDate]);

  // Create chore name lookup map for history
  const choreNameMap = chores.reduce<Record<string, string>>((acc, chore) => {
    acc[chore.id] = chore.name;
    return acc;
  }, {});

  // Create member name lookup for history
  const memberNameMap = members.reduce<Record<string, string>>((acc, member) => {
    acc[member.user_id] = member.display_name || 'Household member';
    return acc;
  }, {});

  useEffect(() => {
    if (currentHousehold?.id) {
      fetchChoresData();
    }
  }, [currentHousehold]);

  const fetchChoresData = async () => {
    if (!currentHousehold) return;
    
    setIsLoading(true);
    try {
      const [choresData, membersData, historyData] = await Promise.all([
        getHouseholdChores(currentHousehold.id),
        getHouseholdMembers(currentHousehold.id),
        getChoreHistory(currentHousehold.id)
      ]);
      
      setChores(choresData);
      setMembers(membersData);
      setChoreHistory(historyData);
      
    } catch (error) {
      toast.error('Failed to load chores data');
      console.error('Error fetching chores data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterAndSortChores();
  }, [chores, filters, periodRange]);

  const filterAndSortChores = () => {
    let allChores = [...chores];
    const { startDate, endDate, now } = periodRange;
    
    // Apply filters to all chores
    if (filters.assignee) {
      if (filters.assignee === 'unassigned') {
        allChores = allChores.filter(chore => !chore.assigned_to);
      } else {
        allChores = allChores.filter(chore => chore.assigned_to === filters.assignee);
      }
    }
    
    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      allChores = allChores.filter(
        chore => 
          chore.name.toLowerCase().includes(query) || 
          (chore.description && chore.description.toLowerCase().includes(query))
      );
    }
    
    // Sort chores
    allChores.sort((a, b) => {
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (filters.sortBy === 'difficulty') {
        return (b.difficulty || 1) - (a.difficulty || 1);
      } else {
        // Default: sort by due date
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
    });
    
    // Split into completed and pending
    const pending = allChores.filter(chore => !chore.completed);
    const completed = allChores.filter(chore => chore.completed);
    
    // Apply status filter only to pending chores if needed
    if (filters.status === 'overdue') {
      const overdue = pending.filter(chore => 
        chore.due_date && isPast(new Date(chore.due_date))
      );
      setPendingChores(overdue);
    } else {
      setPendingChores(pending);
    }
    
    setCompletedChores(completed);
  };

  const isWithinPeriod = (chore: Chore) => {
    const { startDate, endDate, now } = periodRange;
    
    if (!startDate || !chore.due_date) return true;
    
    const dueDate = new Date(chore.due_date);
    return isWithinInterval(dueDate, {
      start: startDate,
      end: endDate || now
    });
  };

  const handleFilterChange = (name: keyof ChoreFilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      assignee: '',
      sortBy: 'dueDate',
      searchQuery: '',
    });
  };

  const handleCustomDateChange = (startDate: Date | null) => {
    setCustomDate(startDate);
  };

  const handleCreateChore = async (choreData: Partial<Chore>) => {
    if (!currentHousehold || !currentUser) return;
    
    try {
      const newChore = await createChore({
        ...choreData,
        household_id: currentHousehold.id,
        created_by: currentUser.id,
      } as Omit<Chore, "id" | "created_at" | "updated_at">);
      
      setChores(prev => [...prev, newChore]);
      setIsCreateDialogOpen(false);
      toast.success('Chore created successfully');
      
    } catch (error) {
      toast.error('Failed to create chore');
      console.error('Error creating chore:', error);
    }
  };

  const handleUpdateChore = async (choreData: Partial<Chore>) => {
    if (!activeChore) return;
    
    try {
      const updatedChore = await updateChore(activeChore.id, choreData);
      
      setChores(prev => 
        prev.map(chore => 
          chore.id === updatedChore.id ? updatedChore : chore
        )
      );
      
      setIsEditDialogOpen(false);
      setActiveChore(null);
      toast.success('Chore updated successfully');
      
    } catch (error) {
      toast.error('Failed to update chore');
      console.error('Error updating chore:', error);
    }
  };

  const handleEditChore = (chore: Chore) => {
    setActiveChore(chore);
    setIsEditDialogOpen(true);
  };

  const handleDeleteChore = (choreId: string) => {
    setChores(prev => prev.filter(chore => chore.id !== choreId));
  };

  const handleCompleteChore = () => {
    // This just refreshes the data
    fetchChoresData();
  };

  if (!currentHousehold) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Household Selected</CardTitle>
          <CardDescription>
            Please select or create a household to manage chores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>You need to be part of a household to manage chores.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container max-w-5xl py-4 pb-20 relative">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Household Chores</h1>
      </div>
      
      <ChoreStatistics 
        chores={chores} 
        choreHistory={choreHistory} 
      />
      
      <div className="my-4">
        <ChoreFilters 
          members={members}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          hideCompletedFilter={true}
        />
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <CollapsibleSection 
            title="Pending Chores" 
            badge={pendingChores.length}
            defaultOpen={true}
          >
            {pendingChores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingChores.map((chore) => (
                  <ChoreCard 
                    key={chore.id}
                    chore={chore}
                    currentUserId={currentUser?.id || ''}
                    members={members}
                    onUpdate={handleCompleteChore}
                    onEdit={handleEditChore}
                    onDelete={handleDeleteChore}
                    isWithinPeriod={isWithinPeriod(chore)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {filters.status === 'overdue' 
                  ? "No overdue chores!" 
                  : "No pending chores match your filters."}
              </div>
            )}
          </CollapsibleSection>
          
          <CollapsibleSection 
            title="Completed Chores" 
            badge={completedChores.length}
            defaultOpen={false}
          >
            {completedChores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedChores.map((chore) => (
                  <ChoreCard 
                    key={chore.id}
                    chore={chore}
                    currentUserId={currentUser?.id || ''}
                    members={members}
                    onUpdate={handleCompleteChore}
                    onEdit={handleEditChore}
                    onDelete={handleDeleteChore}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No completed chores yet.
              </div>
            )}
          </CollapsibleSection>
        </>
      )}
      
      <div className="mt-6">
        <CollapsibleSection title="Chore History" defaultOpen={false}>
          <Card>
            <CardContent className="p-3">
              <ChoreHistory 
                historyEntries={choreHistory}
                memberNames={memberNameMap}
                choreNames={choreNameMap}
              />
            </CardContent>
          </Card>
        </CollapsibleSection>
      </div>
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-10 mb-[50px]">
        <Button 
          size="lg" 
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusCircle className="!h-8 !w-8" />
        </Button>
      </div>
      
      {/* Create Chore Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-full h-[100dvh] p-0 gap-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-bold">Create New Chore</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <ChoreForm 
                onSubmit={handleCreateChore}
                members={members}
                householdId={currentHousehold.id}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Chore Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-full h-[100dvh] p-0 gap-0">
          {activeChore && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-xl font-bold">Edit Chore</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <ChoreForm 
                  onSubmit={handleUpdateChore}
                  initialValues={activeChore}
                  members={members}
                  householdId={currentHousehold.id}
                  isEditing
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chores;
