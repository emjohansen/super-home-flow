
import React, { useState, useMemo, useEffect } from 'react';
import { Chore, ChoreHistory } from '@/types/chore';
import { 
  addDays, 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  isBefore, 
  isAfter,
  differenceInDays, 
  isWithinInterval,
  isSameDay
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
  const [customDate, setCustomDate] = useState<Date | null>(null);
  
  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    
    // Set the start date based on the selected period
    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case '14-days':
        startDate = addDays(startOfDay(now), -14);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'custom':
        startDate = customDate;
        break;
      case 'all':
        // No start date for all time
        startDate = null;
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
    }
    
    // Filter history entries that fall within the selected period
    const recentHistory = choreHistory.filter(entry => {
      if (!startDate) return true; // Include all for 'all' period
      
      const entryDate = new Date(entry.completed_at);
      return isAfter(entryDate, startDate) || isSameDay(entryDate, startDate);
    });
    
    // Filter pending chores that are due within the period
    const pendingChoresInPeriod = chores.filter(chore => {
      // Only include non-completed chores
      if (chore.completed) return false;
      
      // For "all" period, include all pending chores
      if (!startDate) return true;
      
      // If no due date, include in all periods (as it's always pending)
      if (!chore.due_date) return true;
      
      const dueDate = new Date(chore.due_date);
      
      // For day period, only include chores due today
      if (period === 'day') {
        return isSameDay(dueDate, now);
      }
      
      // For other periods, include chores due before end of period
      return !isAfter(dueDate, now);
    }).length;
    
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
      pendingChoresInPeriod,
      completedThisPeriod,
      dueWithin48Hours,
      overdueChores
    };
  }, [chores, choreHistory, period, customDate]);
  
  const periodLabel = {
    day: "Today",
    week: "This Week",
    '14-days': "Last 14 Days",
    month: "This Month",
    custom: customDate ? `Since ${customDate.toLocaleDateString()}` : "Custom",
    all: "All Time"
  }[period];

  const handleCustomDateChange = (startDate: Date | null) => {
    setCustomDate(startDate);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">Chore Statistics</h2>
      </div>
      
      <div className="mb-3">
        <PeriodToggle 
          value={period} 
          onValueChange={setPeriod} 
          customStartDate={customDate}
          onCustomDateChange={handleCustomDateChange}
        />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-2xl font-semibold">{stats.pendingChoresInPeriod}</div>
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
