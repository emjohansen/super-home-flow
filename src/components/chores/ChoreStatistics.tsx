
import React from 'react';
import { Chore, ChoreHistory } from '@/types/chore';
import { isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';

interface ChoreStatisticsProps {
  chores: Chore[];
  choreHistory: ChoreHistory[];
}

export const ChoreStatistics: React.FC<ChoreStatisticsProps> = ({ 
  chores, 
  choreHistory 
}) => {
  const now = new Date();
  
  const stats = React.useMemo(() => {
    // Get all pending chores
    const pendingChores = chores.filter(chore => !chore.completed);
    
    // Get all completed chores
    const completedChores = chores.filter(chore => chore.completed);
    
    // Find overdue chores (due before today, not including today)
    const overdue = pendingChores.filter(chore => {
      if (!chore.due_date) return false;
      const dueDate = new Date(chore.due_date);
      return isPast(dueDate) && !isToday(dueDate);
    }).length;
    
    // Find chores due soon (today and tomorrow)
    const dueSoon = pendingChores.filter(chore => {
      if (!chore.due_date) return false;
      const dueDate = new Date(chore.due_date);
      return isToday(dueDate) || isTomorrow(dueDate);
    }).length;
    
    return {
      pending: pendingChores.length,
      completed: completedChores.length,
      overdue,
      dueSoon
    };
  }, [chores]);
  
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">Chore Statistics</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-2xl font-semibold">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-2xl font-semibold">{stats.completed}</div>
          </CardContent>
        </Card>
        
        {stats.overdue > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
            <CardContent className="p-3">
              <div className="text-xs text-red-600 dark:text-red-400">Overdue</div>
              <div className="text-2xl font-semibold text-red-700 dark:text-red-400">{stats.overdue}</div>
            </CardContent>
          </Card>
        )}
        
        {stats.dueSoon > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
            <CardContent className="p-3">
              <div className="text-xs text-yellow-600 dark:text-yellow-400">Due Soon</div>
              <div className="text-2xl font-semibold text-yellow-700 dark:text-yellow-400">{stats.dueSoon}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
