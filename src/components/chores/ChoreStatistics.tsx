
import React, { useState, useMemo } from 'react';
import { Chore, ChoreHistory } from '@/types/chore';
import { 
  addDays, 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  isBefore, 
  isAfter,
  isWithinInterval,
  endOfDay,
  endOfWeek,
  endOfMonth,
  subDays
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
  
  const periodRange = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    // Set the start and end date based on the selected period
    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case '14-days':
        startDate = subDays(now, 14);
        endDate = now;
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'custom':
        if (customDate) {
          startDate = startOfDay(customDate);
          endDate = endOfDay(now);
        } else {
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
        }
        break;
      case 'all':
        // No start date for all time
        startDate = null;
        endDate = null;
        break;
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    }
    
    return { startDate, endDate, now };
  }, [period, customDate]);
  
  const stats = useMemo(() => {
    const { startDate, endDate, now } = periodRange;
    
    // Filter history entries that fall within the selected period
    const completedInPeriod = choreHistory.filter(entry => {
      if (!startDate) return true; // Include all for 'all' period
      
      const entryDate = new Date(entry.completed_at);
      return isWithinInterval(entryDate, {
        start: startDate,
        end: endDate || now
      });
    }).length;
    
    // Get all pending chores (regardless of period)
    const pendingChores = chores.filter(chore => !chore.completed);
    
    // Filter pending chores that are within the period
    const pendingInPeriod = pendingChores.filter(chore => {
      // If no due date, include in pending
      if (!chore.due_date) return true;
      
      // If all period, include all pending
      if (!startDate) return true;
      
      const dueDate = new Date(chore.due_date);
      
      // Include if due date is within period
      return isWithinInterval(dueDate, {
        start: startDate,
        end: endDate || now
      });
    }).length;
    
    // Find chores due within 48 hours (due soon)
    const dueSoon = pendingChores.filter(chore => {
      if (!chore.due_date) return false;
      
      const dueDate = new Date(chore.due_date);
      const twoDaysFromNow = addDays(now, 2);
      
      return isWithinInterval(dueDate, {
        start: now,
        end: twoDaysFromNow
      });
    }).length;
    
    // Calculate overdue chores
    const overdue = pendingChores.filter(chore => {
      if (!chore.due_date) return false;
      
      const dueDate = new Date(chore.due_date);
      return isBefore(dueDate, now);
    }).length;
    
    return {
      pendingInPeriod,
      completedInPeriod,
      dueSoon,
      overdue,
      totalPending: pendingChores.length
    };
  }, [chores, choreHistory, periodRange]);
  
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
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-2xl font-semibold">{stats.pendingInPeriod}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{periodLabel} Completed</div>
            <div className="text-2xl font-semibold">{stats.completedInPeriod}</div>
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
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800">
            <CardContent className="p-3">
              <div className="text-xs text-amber-600 dark:text-amber-400">Due Soon</div>
              <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{stats.dueSoon}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
