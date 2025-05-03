
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  Calendar as CalendarIcon,
  Edit,
  Trash,
  Clock,
  CheckCircle,
  X,
  Lock,
  Globe
} from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string | null;
  is_reminder: boolean;
  reminder_date: string | null;
  is_completed: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  household_id: string | null;
}

const Notes = () => {
  const { currentUser } = useAuth();
  const { currentHousehold } = useHousehold();
  const { translate } = useLanguage();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'notes' | 'reminders'>('notes');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    is_reminder: false,
    reminder_date: null as Date | null,
    is_completed: false,
    is_private: false
  });
  
  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error(`Error fetching notes: ${error.message}`);
        throw error;
      }
      
      return data as Note[];
    },
    enabled: !!currentUser
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (note: typeof newNote) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title: note.title,
          content: note.content,
          is_reminder: note.is_reminder,
          reminder_date: note.reminder_date ? new Date(note.reminder_date).toISOString() : null,
          is_completed: note.is_completed,
          is_private: note.is_private,
          created_by: currentUser.id,
          household_id: note.is_private ? null : currentHousehold?.id || null
        }])
        .select('*');
      
      if (error) throw error;
      
      return data[0] as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success(newNote.is_reminder ? 'Reminder created' : 'Note created');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Error creating note: ${error.message}`);
    }
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async (note: Note) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: note.title,
          content: note.content,
          is_reminder: note.is_reminder,
          reminder_date: note.reminder_date,
          is_completed: note.is_completed,
          is_private: note.is_private,
          updated_at: new Date().toISOString(),
          household_id: note.is_private ? null : currentHousehold?.id || null
        })
        .eq('id', note.id)
        .select('*');
      
      if (error) throw error;
      
      return data[0] as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note updated');
      resetForm();
      setEditingNote(null);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Error updating note: ${error.message}`);
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      
      if (error) throw error;
      
      return noteId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted');
      
      // If we were editing this note, close the dialog
      if (editingNote?.id === deletedId) {
        setEditingNote(null);
        setIsDialogOpen(false);
      }
    },
    onError: (error: any) => {
      toast.error(`Error deleting note: ${error.message}`);
    }
  });

  // Toggle completion status
  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ noteId, isCompleted }: { noteId: string, isCompleted: boolean }) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notes')
        .update({ 
          is_completed: isCompleted,
          updated_at: new Date().toISOString() 
        })
        .eq('id', noteId)
        .select('*');
      
      if (error) throw error;
      
      return data[0] as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: any) => {
      toast.error(`Error updating completion status: ${error.message}`);
    }
  });

  const resetForm = () => {
    setNewNote({
      title: '',
      content: '',
      is_reminder: false,
      reminder_date: null,
      is_completed: false,
      is_private: false
    });
  };

  const handleCreate = () => {
    if (!newNote.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (newNote.is_reminder && !newNote.reminder_date) {
      toast.error('Please select a reminder date');
      return;
    }
    
    createNoteMutation.mutate(newNote);
  };

  const handleUpdate = () => {
    if (!editingNote) return;
    
    if (!editingNote.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (editingNote.is_reminder && !editingNote.reminder_date) {
      toast.error('Please select a reminder date');
      return;
    }
    
    updateNoteMutation.mutate(editingNote);
  };

  const handleDelete = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const toggleCompletion = (noteId: string, currentStatus: boolean) => {
    toggleCompletionMutation.mutate({ 
      noteId, 
      isCompleted: !currentStatus 
    });
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setIsDialogOpen(true);
  };

  const addNewNote = () => {
    setEditingNote(null);
    resetForm();
    setNewNote(prev => ({ 
      ...prev, 
      is_reminder: activeTab === 'reminders',
      is_private: false
    }));
    setIsDialogOpen(true);
  };

  // Filter notes based on active tab
  const filteredNotes = notes.filter(note => 
    activeTab === 'reminders' ? note.is_reminder : !note.is_reminder
  );

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foodish-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{translate(activeTab === 'reminders' ? 'reminders' : 'notes')}</h1>
        <Button onClick={addNewNote} className="bg-foodish-500 hover:bg-foodish-600">
          <Plus className="h-4 w-4 mr-2" /> 
          {translate(activeTab === 'reminders' ? 'addReminder' : 'addNote')}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={activeTab === 'notes' ? 'default' : 'outline'}
          className={activeTab === 'notes' ? 'bg-foodish-500 hover:bg-foodish-600' : ''}
          onClick={() => setActiveTab('notes')}
        >
          Notes
        </Button>
        <Button
          variant={activeTab === 'reminders' ? 'default' : 'outline'}
          className={activeTab === 'reminders' ? 'bg-foodish-500 hover:bg-foodish-600' : ''}
          onClick={() => setActiveTab('reminders')}
        >
          Reminders
        </Button>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <Card key={note.id} className={`transition-colors border-foodish-100 ${
              note.is_completed ? 'bg-gray-50 border-gray-200' : ''
            }`}>
              <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-start space-y-0">
                <div className="flex-1">
                  <CardTitle className={`text-lg ${note.is_completed ? 'line-through text-gray-500' : ''}`}>
                    {note.title}
                  </CardTitle>
                  <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                    {note.is_reminder && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {note.reminder_date && format(new Date(note.reminder_date), 'PPP')}
                      </div>
                    )}
                    {note.is_private && (
                      <div className="flex items-center">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </div>
                    )}
                    {!note.is_private && (
                      <div className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        Shared
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => toggleCompletion(note.id, note.is_completed)}
                    className={`rounded-full p-1 transition-colors ${
                      note.is_completed 
                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100' 
                        : 'text-foodish-500 hover:text-foodish-600 hover:bg-foodish-50'
                    }`}
                  >
                    <CheckCircle className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-2">
                <p className={`text-sm ${note.is_completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                  {note.content}
                </p>
              </CardContent>
              <CardFooter className="px-4 pt-0 pb-4 flex justify-between">
                <div className="text-xs text-gray-500">
                  {format(new Date(note.created_at), 'MMM d, yyyy')}
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => openEditDialog(note)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="rounded-full bg-foodish-50 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            {activeTab === 'reminders' ? (
              <Clock className="h-6 w-6 text-foodish-500" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-foodish-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900">No {activeTab} yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new {activeTab === 'reminders' ? 'reminder' : 'note'}.
          </p>
          <Button 
            onClick={addNewNote}
            variant="outline"
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create {activeTab === 'reminders' ? 'reminder' : 'note'}
          </Button>
        </div>
      )}

      {/* Note Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNote 
                ? `Edit ${editingNote.is_reminder ? 'Reminder' : 'Note'}`
                : `New ${newNote.is_reminder ? 'Reminder' : 'Note'}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Enter title"
                value={editingNote ? editingNote.title : newNote.title}
                onChange={(e) => 
                  editingNote 
                    ? setEditingNote({ ...editingNote, title: e.target.value })
                    : setNewNote({ ...newNote, title: e.target.value })
                }
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Enter content"
                rows={4}
                value={editingNote ? editingNote.content || '' : newNote.content}
                onChange={(e) => 
                  editingNote 
                    ? setEditingNote({ ...editingNote, content: e.target.value })
                    : setNewNote({ ...newNote, content: e.target.value })
                }
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-reminder"
                checked={editingNote ? editingNote.is_reminder : newNote.is_reminder}
                onCheckedChange={(checked) => 
                  editingNote 
                    ? setEditingNote({ ...editingNote, is_reminder: !!checked })
                    : setNewNote({ ...newNote, is_reminder: !!checked })
                }
              />
              <label htmlFor="is-reminder" className="text-sm font-medium">
                This is a reminder
              </label>
            </div>
            
            {/* Reminder Date */}
            {(editingNote ? editingNote.is_reminder : newNote.is_reminder) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reminder Date</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingNote?.reminder_date 
                        ? format(new Date(editingNote.reminder_date), 'PPP')
                        : newNote.reminder_date
                          ? format(newNote.reminder_date, 'PPP')
                          : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingNote?.reminder_date 
                        ? new Date(editingNote.reminder_date)
                        : newNote.reminder_date
                      }
                      onSelect={(date) => {
                        if (editingNote) {
                          setEditingNote({ 
                            ...editingNote, 
                            reminder_date: date ? date.toISOString() : null 
                          });
                        } else {
                          setNewNote({ ...newNote, reminder_date: date });
                        }
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-private"
                checked={editingNote ? editingNote.is_private : newNote.is_private}
                onCheckedChange={(checked) => 
                  editingNote 
                    ? setEditingNote({ ...editingNote, is_private: !!checked })
                    : setNewNote({ ...newNote, is_private: !!checked })
                }
              />
              <label htmlFor="is-private" className="text-sm font-medium">
                Private (only visible to me)
              </label>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingNote(null);
                resetForm();
                setIsDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              className="bg-foodish-500 hover:bg-foodish-600"
              onClick={() => editingNote ? handleUpdate() : handleCreate()}
            >
              {editingNote ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notes;
