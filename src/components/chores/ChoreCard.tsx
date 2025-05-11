
import React from 'react';
import { Chore, HouseholdMember } from '@/types/chore';
import { format, isPast } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
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

  const assignedMember = members.find(member => member.id === chore.assigned_to);
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
    <Card className={`transition-all ${chore.completed ? 'bg-gray-100 dark:bg-gray-800 opacity-70' : isOverdue ? 'border-red-500 dark:border-red-400' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`${chore.completed ? 'line-through text-gray-500' : ''}`}>
              {chore.name}
            </CardTitle>
            <CardDescription>
              {chore.description || 'No description'}
            </CardDescription>
          </div>
          
          {chore.difficulty && (
            <Badge variant="outline" className="ml-2">
              {getDifficultyLabel(chore.difficulty)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex flex-col gap-1">
          {chore.due_date && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                Due: {format(new Date(chore.due_date), 'PPP')}
              </span>
            </div>
          )}
          
          {assignedMember && (
            <div className="text-sm flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: assignedMember.avatar_color || '#888' }}
              />
              <span>
                Assigned to: {assignedMember.display_name || 'Household member'}
              </span>
            </div>
          )}
          
          {chore.estimated_minutes && (
            <div className="text-sm">
              Estimated time: {chore.estimated_minutes} min
            </div>
          )}
          
          {chore.recurrence && chore.recurrence !== 'once' && (
            <Badge className="w-fit mt-1">
              {chore.recurrence.charAt(0).toUpperCase() + chore.recurrence.slice(1)}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8"
            onClick={() => onEdit(chore)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            className="h-8"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
        
        {!chore.completed && (
          <Button 
            size="sm" 
            onClick={handleComplete}
            className="h-8"
          >
            <Check className="h-4 w-4 mr-1" />
            Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
