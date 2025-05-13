
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export type TimePeriod = 'day' | 'week' | '14-days' | 'month' | 'all' | 'custom';

interface PeriodToggleProps {
  value: TimePeriod;
  onValueChange: (value: TimePeriod) => void;
  customStartDate?: Date | null;
  customEndDate?: Date | null;
  onCustomDateChange?: (startDate: Date | null, endDate: Date | null) => void;
}

export const PeriodToggle: React.FC<PeriodToggleProps> = ({
  value,
  onValueChange,
  customStartDate,
  customEndDate,
  onCustomDateChange
}) => {
  const [date, setDate] = React.useState<Date | undefined>(customStartDate || undefined);

  const handleDateSelect = (date: Date | undefined) => {
    setDate(date || undefined);
    if (date && onCustomDateChange) {
      onCustomDateChange(date, null);
      onValueChange('custom');
    }
  };

  return (
    <div className="flex items-center mb-2">
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
        <ToggleGroupItem value="14-days" className="text-xs h-6 px-2">14-days</ToggleGroupItem>
        <ToggleGroupItem value="month" className="text-xs h-6 px-2">Month</ToggleGroupItem>
        <ToggleGroupItem value="all" className="text-xs h-6 px-2">All Time</ToggleGroupItem>
        
        <Popover>
          <PopoverTrigger asChild>
            <ToggleGroupItem value="custom" className="text-xs h-6 px-2">
              <Calendar className="h-3 w-3 mr-1" />
              Custom
            </ToggleGroupItem>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </ToggleGroup>
    </div>
  );
};
