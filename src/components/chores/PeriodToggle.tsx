
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type TimePeriod = 'day' | 'week' | 'biweekly' | 'month';

interface PeriodToggleProps {
  value: TimePeriod;
  onValueChange: (value: TimePeriod) => void;
}

export const PeriodToggle: React.FC<PeriodToggleProps> = ({
  value,
  onValueChange
}) => {
  return (
    <div className="flex items-center justify-end mb-2">
      <span className="text-xs mr-2 text-muted-foreground">Period:</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(val) => val && onValueChange(val as TimePeriod)}
        size="sm"
        variant="outline"
        className="border rounded-md"
      >
        <ToggleGroupItem value="day" className="text-xs h-6 px-2">Day</ToggleGroupItem>
        <ToggleGroupItem value="week" className="text-xs h-6 px-2">Week</ToggleGroupItem>
        <ToggleGroupItem value="biweekly" className="text-xs h-6 px-2">2 Weeks</ToggleGroupItem>
        <ToggleGroupItem value="month" className="text-xs h-6 px-2">Month</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
