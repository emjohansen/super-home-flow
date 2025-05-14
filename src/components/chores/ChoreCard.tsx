
import React, { useState } from 'react';
import { Chore, HouseholdMember } from '@/types/chore';
import { format, isPast } from 'date-fns';
import { 
  Card, 
  CardContent, 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Edit, Trash2, X } from 'lucide-react';
import { completeChore, uncompleteChore, deleteChore } from '@/services/choreService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ChoreCardProps {
  chore: Chore;
  currentUserId: string;
  members: HouseholdMember[];
  onUpdate: (chore: Chore) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (choreId: string) => void;
  isWithinPeriod?: boolean;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  currentUserId,
  members,
  onUpdate,
  onEdit,
  onDelete,
  isWithinPeriod = true
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleComplete = async () => {
    try {
      await completeChore(chore, currentUserId);
      toast.success('Chore completed!');
      onUpdate(chore);
    } catch (error) {
      toast.error('Failed to complete chore');
      console.error(error);
    }
  };

  const handleUncomplete = async () => {
    try {
      await uncompleteChore(chore, currentUserId);
      toast.success('Chore marked as pending');
      onUpdate(chore);
    } catch (error) {
      toast.error('Failed to update chore');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteChore(chore.id);
      toast.success('Chore deleted');
      onDelete(chore.id);
    } catch (error) {
      toast.error('Failed to delete chore');
      console.error(error);
    }
  };

  const toggleDetails = () => {
    setDetailsOpen(!detailsOpen);
  };

  const assignedMember = members.find(member => member.user_id === chore.assigned_to);
  const isOverdue = chore.due_date && isPast(new Date(chore.due_date)) && !chore.completed;
  
  const getDifficultyLabel = (difficulty: number) => {
    switch(difficulty) {
      case 1: return 'Very Easy';
      case 2: return 'Easy';
      case 3: return 'Moderate';
      case 4: return 'Hard';
      case 5: return 'Very Hard';
      default: return 'Unknown';
    }
  };

  const cardClass = () => {
    let baseClass = "transition-all";
    
    if (chore.completed) {
      return `${baseClass} bg-gray-50 dark:bg-gray-800/50 opacity-80`;
    }
    
    if (isOverdue) {
      return `${baseClass} border-red-300 dark:border-red-800`;
    }
    
    if (!isWithinPeriod) {
      return `${baseClass} opacity-50`;
    }
    
    return baseClass;
  };

  return (
    <>
      <Card className={cardClass()} onClick={toggleDetails}>
        <CardContent className="p-3">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm ${chore.completed ? 'line-through text-muted-foreground' : ''} line-clamp-2`}>
                {chore.name}
              </h3>
              {chore.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {chore.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {chore.difficulty && (
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  {getDifficultyLabel(chore.difficulty)}
                </Badge>
              )}
              
              {chore.recurrence && chore.recurrence !== 'once' && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5 capitalize">
                  {chore.recurrence}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-1 mb-2">
            <div className="flex gap-4">
              {chore.due_date && (
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                    {format(new Date(chore.due_date), 'MMM d')}
                  </span>
                </div>
              )}
              
              {assignedMember && (
                <div className="text-xs flex items-center gap-1 flex-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: assignedMember.avatar_color || '#888' }}
                  />
                  <span className="truncate">
                    {assignedMember.display_name || 'Member'}
                  </span>
                </div>
              )}
              
              {chore.estimated_minutes && (
                <div className="text-xs text-muted-foreground">
                  {chore.estimated_minutes} min
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-1">
            {!chore.completed ? (
              <Button 
                size="sm" 
                className="h-7 text-xs flex-shrink-0 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete();
                }}
              >
                <Check className="h-3 w-3 mr-1" /> Done
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline"
                className="h-7 text-xs flex-shrink-0 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUncomplete();
                }}
              >
                <X className="h-3 w-3 mr-1" /> Undo
              </Button>
            )}
            
            <div className="flex gap-1 ml-auto flex-shrink-0">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(chore);
                }}
                title="Edit"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{chore.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {chore.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm">{chore.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {chore.due_date && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Due Date</h4>
                  <p className="text-sm">
                    {format(new Date(chore.due_date), 'PPP')}
                  </p>
                </div>
              )}
              
              {assignedMember && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Assigned To</h4>
                  <div className="text-sm flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: assignedMember.avatar_color || '#888' }}
                    />
                    {assignedMember.display_name || 'Member'}
                  </div>
                </div>
              )}
              
              {chore.difficulty && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Difficulty</h4>
                  <p className="text-sm">{getDifficultyLabel(chore.difficulty)}</p>
                </div>
              )}
              
              {chore.estimated_minutes && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Estimated Time</h4>
                  <p className="text-sm">{chore.estimated_minutes} minutes</p>
                </div>
              )}
              
              {chore.recurrence && chore.recurrence !== 'once' && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Recurrence</h4>
                  <p className="text-sm capitalize">{chore.recurrence}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-4">
              {!chore.completed ? (
                <Button 
                  onClick={() => {
                    handleComplete();
                    setDetailsOpen(false);
                  }}
                  className="flex-1 mr-2"
                >
                  <Check className="h-4 w-4 mr-2" /> Mark Complete
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleUncomplete();
                    setDetailsOpen(false);
                  }}
                  className="flex-1 mr-2"
                >
                  <X className="h-4 w-4 mr-2" /> Mark Incomplete
                </Button>
              )}
              
              <Button 
                variant="secondary"
                onClick={() => {
                  setDetailsOpen(false);
                  onEdit(chore);
                }}
                className="flex-1 ml-2"
              >
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
