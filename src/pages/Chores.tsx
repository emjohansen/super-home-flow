
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChoreCard } from '@/components/chores/ChoreCard';
import { ChoreForm } from '@/components/chores/ChoreForm';
import { ChoreStatistics } from '@/components/chores/ChoreStatistics';
import { ChoreHistory } from '@/components/chores/ChoreHistory';
import { ChoreFilters, ChoreFilterOptions } from '@/components/chores/ChoreFilters';
import { PlusCircle } from 'lucide-react';

const Chores: React.FC = () => {
  const { currentUser } = useAuth();
  const { currentHousehold } = useHousehold();
  
  const [chores, setChores] = useState<Chore[]>([]);
  const [filteredChores, setFilteredChores] = useState<Chore[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [choreHistory, setChoreHistory] = useState<ChoreHistoryType[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [activeChore, setActiveChore] = useState<Chore | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const [filters, setFilters] = useState<ChoreFilterOptions>({
    status: 'all',
    assignee: '',
    sortBy: 'dueDate',
    searchQuery: '',
  });

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
  }, [chores, filters, activeTab]);

  const filterAndSortChores = () => {
    let result = [...chores];
    
    // Filter by tab
    if (activeTab === 'completed') {
      result = result.filter(chore => chore.completed);
    } else if (activeTab === 'pending') {
      result = result.filter(chore => !chore.completed);
    }
    
    // Apply additional filters
    if (filters.status !== 'all') {
      if (filters.status === 'completed') {
        result = result.filter(chore => chore.completed);
      } else if (filters.status === 'pending') {
        result = result.filter(chore => !chore.completed);
      } else if (filters.status === 'overdue') {
        result = result.filter(chore => 
          !chore.completed && 
          chore.due_date && 
          isPast(new Date(chore.due_date))
        );
      }
    }
    
    // Filter by assignee
    if (filters.assignee) {
      if (filters.assignee === 'unassigned') {
        result = result.filter(chore => !chore.assigned_to);
      } else {
        result = result.filter(chore => chore.assigned_to === filters.assignee);
      }
    }
    
    // Filter by search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        chore => 
          chore.name.toLowerCase().includes(query) || 
          (chore.description && chore.description.toLowerCase().includes(query))
      );
    }
    
    // Sort chores
    result.sort((a, b) => {
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
    
    setFilteredChores(result);
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

  // Create member name lookup for history
  const memberNameMap = members.reduce<Record<string, string>>((acc, member) => {
    acc[member.user_id] = member.display_name || 'Household member';
    return acc;
  }, {});

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
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-4">Household Chores</h1>
      
      <ChoreStatistics 
        chores={chores} 
        choreHistory={choreHistory} 
      />
      
      <div className="flex items-center justify-between my-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full max-w-md"
        >
          <TabsList>
            <TabsTrigger value="all">All Chores</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Chore
        </Button>
      </div>
      
      <ChoreFilters 
        members={members}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
      />
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-48 animate-pulse" />
          ))}
        </div>
      ) : filteredChores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredChores.map((chore) => (
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-xl font-medium mb-4">No chores found</p>
            <p className="text-muted-foreground mb-6 text-center">
              {activeTab === 'completed' 
                ? "You haven't completed any chores yet." 
                : activeTab === 'pending' 
                  ? "Great job! You have no pending chores." 
                  : "No chores match your current filters."}
            </p>
            {activeTab !== 'pending' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Chore
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Chore History</h2>
        <Card>
          <CardContent className="p-4">
            <ChoreHistory 
              historyEntries={choreHistory}
              memberNames={memberNameMap}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Create Chore Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
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
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Chore</SheetTitle>
          </SheetHeader>
          {activeChore && (
            <div className="py-6">
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
