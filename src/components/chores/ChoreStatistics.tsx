
import React from 'react';
import { Chore, ChoreHistory } from '@/types/chore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, AlarmClock, Calendar } from 'lucide-react';

interface ChoreStatisticsProps {
  chores: Chore[];
  choreHistory: ChoreHistory[];
}

export const ChoreStatistics: React.FC<ChoreStatisticsProps> = ({ chores, choreHistory }) => {
  const totalChores = chores.length;
  const completedChores = chores.filter(chore => chore.completed).length;
  const pendingChores = totalChores - completedChores;
  const totalCompletedAllTime = choreHistory.length;
  
  const overdueChores = chores.filter(chore => {
    if (!chore.due_date || chore.completed) return false;
    return new Date(chore.due_date) < new Date();
  }).length;
  
  const completionRate = totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0;
  
  const weeklyChores = chores.filter(chore => chore.recurrence === 'weekly').length;
  const dailyChores = chores.filter(chore => chore.recurrence === 'daily').length;
  
  // Calculate total estimated time for pending chores
  const totalEstimatedTime = chores
    .filter(chore => !chore.completed && chore.estimated_minutes)
    .reduce((total, chore) => total + (chore.estimated_minutes || 0), 0);
    
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`;
  };
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Chore Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedChores} / {totalChores}</div>
          <p className="text-xs text-muted-foreground">
            Completion rate: {completionRate}%
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-2 rounded-full bg-primary" 
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{pendingChores}</div>
              <p className="text-xs text-muted-foreground">
                {overdueChores > 0 && (
                  <span className="text-red-500 font-medium">
                    {overdueChores} overdue
                  </span>
                )}
              </p>
            </div>
            <CheckSquare className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Estimated Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{formatTime(totalEstimatedTime)}</div>
              <p className="text-xs text-muted-foreground">
                For pending chores
              </p>
            </div>
            <AlarmClock className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recurring Chores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{dailyChores + weeklyChores}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {dailyChores > 0 && <Badge variant="outline">Daily: {dailyChores}</Badge>}
                {weeklyChores > 0 && <Badge variant="outline">Weekly: {weeklyChores}</Badge>}
              </div>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
