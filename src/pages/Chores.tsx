
import React, { useState, useEffect } from 'react';
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
import { isPast } from 'date-fns';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PlusCircle } from 'lucide-react';

import { ChoreCard } from '@/components/chores/ChoreCard';
import { ChoreForm } from '@/components/chores/ChoreForm';
import { ChoreStatistics } from '@/components/chores/ChoreStatistics';
import { ChoreHistory } from '@/components/chores/ChoreHistory';
import { ChoreFilters, ChoreFilterOptions } from '@/components/chores/ChoreFilters';
import { CollapsibleSection } from '@/components/chores/CollapsibleSection';

const Chores: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentHousehold } = useHousehold();
  
  const [chores, setChores] = useState<Chore[]>([]);
  const [pendingChores, setPendingChores] = useState<Chore[]>([]);
  const [completedChores, setCompletedChores] = useState<Chore[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [choreHistory, setChoreHistory] = useState<ChoreHistoryType[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [activeChore, setActiveChore] = useState<Chore | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [filters, setFilters] = useState<ChoreFilterOptions>({
    status: 'all',
    assignee: '',
    sortBy: 'dueDate',
    searchQuery: '',
  });

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
  }, [chores, filters]);

  const filterAndSortChores = () => {
    let allChores = [...chores];
    
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
      
      setIsEditSheetOpen(false);
      setActiveChore(null);
      toast.success('Chore updated successfully');
      
    } catch (error) {
      toast.error('Failed to update chore');
      console.error('Error updating chore:', error);
    }
  };

  const handleEditChore = (chore: Chore) => {
    setActiveChore(chore);
    setIsEditSheetOpen(true);
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
    <div className="container max-w-5xl py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Household Chores</h1>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Chore
        </Button>
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
      
      {/* Create Chore Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Chore</DialogTitle>
          </DialogHeader>
          <ChoreForm 
            onSubmit={handleCreateChore}
            members={members}
            householdId={currentHousehold.id}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Chore Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Chore</SheetTitle>
          </SheetHeader>
          {activeChore && (
            <div className="py-4">
              <ChoreForm 
                onSubmit={handleUpdateChore}
                initialValues={activeChore}
                members={members}
                householdId={currentHousehold.id}
                isEditing
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Chores;
