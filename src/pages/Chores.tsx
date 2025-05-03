import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, X, RotateCw } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { toast } from '@/components/ui/sonner';

// Chore type
type Chore = {
  id: string;
  name: string;
  assignedTo: string;
  dueDate: string;
  isCompleted: boolean;
  isRecurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
};

const Chores = () => {
  const { currentHousehold } = useHousehold();
  const { translate } = useLanguage();
  const [chores, setChores] = useState<Chore[]>([]);
  const [newChore, setNewChore] = useState<Partial<Chore>>({
    name: '',
    assignedTo: '',
    dueDate: new Date().toISOString().split('T')[0],
    isCompleted: false,
    isRecurring: false,
  });
  const [activeTab, setActiveTab] = useState('pending');

  // Load sample chores
  useEffect(() => {
    // In a real app, this would fetch from a database
    const sampleChores: Chore[] = [
      {
        id: '1',
        name: 'Vacuum living room',
        assignedTo: currentHousehold?.members[0]?.id || '',
        dueDate: '2025-05-05',
        isCompleted: false,
        isRecurring: true,
        frequency: 'weekly',
      },
      {
        id: '2',
        name: 'Clean bathroom',
        assignedTo: currentHousehold?.members[0]?.id || '',
        dueDate: '2025-05-06',
        isCompleted: false,
        isRecurring: true,
        frequency: 'weekly',
      },
      {
        id: '3',
        name: 'Take out trash',
        assignedTo: currentHousehold?.members[0]?.id || '',
        dueDate: '2025-05-04',
        isCompleted: true,
        isRecurring: true,
        frequency: 'weekly',
      },
    ];
    
    setChores(sampleChores);
  }, [currentHousehold]);

  // Filter chores based on tab
  const filteredChores = chores.filter(chore => {
    return activeTab === 'completed' ? chore.isCompleted : !chore.isCompleted;
  });
  
  // Create a new chore
  const handleCreateChore = () => {
    if (!newChore.name || !newChore.assignedTo) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const chore: Chore = {
      id: Math.random().toString(36).substring(2, 9),
      name: newChore.name,
      assignedTo: newChore.assignedTo,
      dueDate: newChore.dueDate || new Date().toISOString().split('T')[0],
      isCompleted: false,
      isRecurring: !!newChore.isRecurring,
      frequency: newChore.frequency,
    };
    
    setChores([...chores, chore]);
    setNewChore({
      name: '',
      assignedTo: '',
      dueDate: new Date().toISOString().split('T')[0],
      isCompleted: false,
      isRecurring: false,
    });
    
    toast.success('Chore created successfully');
  };
  
  // Toggle chore completion
  const toggleChoreCompletion = (id: string) => {
    setChores(chores.map(chore => 
      chore.id === id ? { ...chore, isCompleted: !chore.isCompleted } : chore
    ));
    
    const chore = chores.find(c => c.id === id);
    toast.success(chore?.isCompleted ? `${chore.name} marked as pending` : `${chore?.name} completed`);
  };
  
  // Delete chore
  const deleteChore = (id: string) => {
    setChores(chores.filter(chore => chore.id !== id));
    toast.success('Chore deleted');
  };
  
  // Get member by ID
  const getMemberById = (id: string) => {
    return currentHousehold?.members.find(member => member.id === id);
  };

  return (
    <div className="p-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{translate('chores')}</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-foodish-500 hover:bg-foodish-600">
              <Plus className="h-4 w-4 mr-2" />
              {translate('addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{translate('addNew')} {translate('chores')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{translate('name')}</label>
                <Input
                  placeholder="Chore name"
                  value={newChore.name}
                  onChange={(e) => setNewChore({ ...newChore, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign to</label>
                <Select
                  value={newChore.assignedTo}
                  onValueChange={(value) => setNewChore({ ...newChore, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentHousehold?.members.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.displayName || member.email.split('@')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Due date</label>
                <Input
                  type="date"
                  value={newChore.dueDate}
                  onChange={(e) => setNewChore({ ...newChore, dueDate: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={newChore.isRecurring}
                  onCheckedChange={(checked) => 
                    setNewChore({ ...newChore, isRecurring: checked as boolean })
                  }
                />
                <label
                  htmlFor="isRecurring"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Recurring chore
                </label>
              </div>
              
              {newChore.isRecurring && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Select
                    value={newChore.frequency}
                    onValueChange={(value: any) => setNewChore({ ...newChore, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreateChore} className="bg-foodish-500 hover:bg-foodish-600">
                {translate('save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="pending" onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 bg-foodish-50">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4 mt-4">
          {filteredChores.length > 0 ? (
            filteredChores.map(chore => (
              <Card key={chore.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-3">
                    <Checkbox
                      checked={chore.isCompleted}
                      onCheckedChange={() => toggleChoreCompletion(chore.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{chore.name}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(chore.dueDate).toLocaleDateString()}
                          {chore.isRecurring && (
                            <span className="ml-1 flex items-center">
                              <RotateCw className="h-3 w-3 mr-1" />
                              {chore.frequency}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {getMemberById(chore.assignedTo) && (
                        <Avatar
                          name={getMemberById(chore.assignedTo)?.displayName || getMemberById(chore.assignedTo)?.email}
                          color={getMemberById(chore.assignedTo)?.avatar_color}
                          size="sm"
                        />
                      )}
                      <button 
                        onClick={() => deleteChore(chore.id)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>No pending chores</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Chore
                  </Button>
                </DialogTrigger>
                <DialogContent>{/* Same content as above */}</DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4 mt-4">
          {filteredChores.length > 0 ? (
            filteredChores.map(chore => (
              <Card key={chore.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-3">
                    <Checkbox
                      checked={chore.isCompleted}
                      onCheckedChange={() => toggleChoreCompletion(chore.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium line-through text-gray-500">{chore.name}</h3>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(chore.dueDate).toLocaleDateString()}
                          {chore.isRecurring && (
                            <span className="ml-1 flex items-center">
                              <RotateCw className="h-3 w-3 mr-1" />
                              {chore.frequency}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {getMemberById(chore.assignedTo) && (
                        <Avatar
                          name={getMemberById(chore.assignedTo)?.displayName || getMemberById(chore.assignedTo)?.email}
                          color={getMemberById(chore.assignedTo)?.avatar_color}
                          size="sm"
                        />
                      )}
                      <button 
                        onClick={() => deleteChore(chore.id)}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>No completed chores</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Chores;
