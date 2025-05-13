
import React from 'react';
import { Chore, HouseholdMember } from '@/types/chore';
import { format, isPast } from 'date-fns';
import { 
  Card, 
  CardContent, 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Edit, Trash2 } from 'lucide-react';
import { completeChore, deleteChore } from '@/services/choreService';
import { toast } from 'sonner';

interface ChoreCardProps {
  chore: Chore;
  currentUserId: string;
  members: HouseholdMember[];
  onUpdate: (chore: Chore) => void;
  onEdit: (chore: Chore) => void;
  onDelete: (choreId: string) => void;
}

export const ChoreCard: React.FC<ChoreCardProps> = ({
  chore,
  currentUserId,
  members,
  onUpdate,
  onEdit,
  onDelete
}) => {
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

  return (
    <Card className={`transition-all ${chore.completed ? 'bg-gray-50 dark:bg-gray-800/50 opacity-80' : isOverdue ? 'border-red-300 dark:border-red-800' : ''}`}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-sm truncate ${chore.completed ? 'line-through text-muted-foreground' : ''}`}>
              {chore.name}
            </h3>
            {chore.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
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
        
        <div className="flex flex-col gap-1 mb-3">
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
        
        <div className="flex justify-between gap-1">
          {!chore.completed && (
            <Button 
              size="sm" 
              className="h-7 px-2 text-xs"
              onClick={handleComplete}
            >
              <Check className="h-3 w-3 mr-1" />
              Complete
            </Button>
          )}
          
          <div className="flex gap-1 ml-auto">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 px-2 text-xs"
              onClick={() => onEdit(chore)}
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
