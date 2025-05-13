
import React, { useState, useMemo } from 'react';
import { Chore, ChoreHistory } from '@/types/chore';
import { 
  addDays, 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  isBefore, 
  differenceInDays, 
  isWithinInterval 
} from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { PeriodToggle, TimePeriod } from './PeriodToggle';

interface ChoreStatisticsProps {
  chores: Chore[];
  choreHistory: ChoreHistory[];
}

export const ChoreStatistics: React.FC<ChoreStatisticsProps> = ({ 
  chores, 
  choreHistory 
}) => {
  const [period, setPeriod] = useState<TimePeriod>('week');
  
  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    // Set the start date based on the selected period
    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'biweekly':
        startDate = addDays(startOfWeek(now, { weekStartsOn: 1 }), -7);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
    }
    
    // Filter history entries that fall within the selected period
    const recentHistory = choreHistory.filter(entry => {
      const entryDate = new Date(entry.completed_at);
      return !isBefore(entryDate, startDate);
    });
    
    // Calculate statistics
    const totalChores = chores.length;
    const completedChores = chores.filter(chore => chore.completed).length;
    const pendingChores = totalChores - completedChores;
    const completionRate = totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0;
    
    // Calculate chores completed during this period
    const completedThisPeriod = recentHistory.length;
    
    // Find chores at risk (due within 48 hours)
    const dueWithin48Hours = chores.filter(chore => {
      if (chore.completed || !chore.due_date) return false;
      
      const dueDate = new Date(chore.due_date);
      const twoDaysFromNow = addDays(now, 2);
      
      return isWithinInterval(dueDate, {
        start: now,
        end: twoDaysFromNow
      });
    }).length;
    
    // Calculate overdue chores
    const overdueChores = chores.filter(chore => {
      if (chore.completed || !chore.due_date) return false;
      
      const dueDate = new Date(chore.due_date);
      return isBefore(dueDate, now);
    }).length;
    
    return {
      totalChores,
      completedChores,
      pendingChores,
      completionRate,
      completedThisPeriod,
      dueWithin48Hours,
      overdueChores
    };
  }, [chores, choreHistory, period]);
  
  const periodLabel = {
    day: "Today",
    week: "This Week",
    biweekly: "Last 2 Weeks",
    month: "This Month"
  }[period];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">Chore Statistics</h2>
        <PeriodToggle value={period} onValueChange={setPeriod} />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-2xl font-semibold">{stats.pendingChores}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Completed</div>
            <div className="text-2xl font-semibold">{stats.completedChores}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Completion Rate</div>
            <div className="text-2xl font-semibold">{stats.completionRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{periodLabel}</div>
            <div className="text-2xl font-semibold">{stats.completedThisPeriod}</div>
          </CardContent>
        </Card>
        
        {stats.overdueChores > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
            <CardContent className="p-3">
              <div className="text-xs text-red-600 dark:text-red-400">Overdue</div>
              <div className="text-2xl font-semibold text-red-700 dark:text-red-400">{stats.overdueChores}</div>
            </CardContent>
          </Card>
        )}
        
        {stats.dueWithin48Hours > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
            <CardContent className="p-3">
              <div className="text-xs text-amber-600 dark:text-amber-400">Due Soon</div>
              <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{stats.dueWithin48Hours}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
