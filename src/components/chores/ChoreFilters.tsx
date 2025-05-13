
import React from 'react';
import { Chore, HouseholdMember } from '@/types/chore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

export type ChoreFilterOptions = {
  status: 'all' | 'completed' | 'pending' | 'overdue';
  assignee: string;
  sortBy: 'dueDate' | 'name' | 'difficulty';
  searchQuery: string;
};

interface ChoreFiltersProps {
  members: HouseholdMember[];
  filters: ChoreFilterOptions;
  onFilterChange: (name: keyof ChoreFilterOptions, value: any) => void;
  onResetFilters: () => void;
}

export const ChoreFilters: React.FC<ChoreFiltersProps> = ({
  members,
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <div className="bg-card rounded-md border p-3 mb-4 text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filters</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 px-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide' : 'Show'} options
        </Button>
      </div>
      
      {isExpanded && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mt-3">
          <div>
            <Select
              value={filters.status}
              onValueChange={(value) => onFilterChange('status', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chores</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={filters.assignee}
              onValueChange={(value) => onFilterChange('assignee', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Assigned To" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Members</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.display_name || 'Household member'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => onFilterChange('sortBy', value as any)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="relative">
              <Input
                placeholder="Search chores..."
                value={filters.searchQuery}
                onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                className="h-8 text-xs pr-7"
              />
              {filters.searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => onFilterChange('searchQuery', '')}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {(filters.status !== 'all' || 
         filters.assignee !== '' || 
         filters.sortBy !== 'dueDate' || 
         filters.searchQuery.trim() !== '') && (
        <div className="flex flex-wrap items-center gap-1 mt-3">
          {filters.status !== 'all' && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFilterChange('status', 'all')}
              />
            </Badge>
          )}
          
          {filters.assignee !== '' && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              {filters.assignee === 'unassigned' 
                ? 'Unassigned' 
                : members.find(m => m.id === filters.assignee)?.display_name || 'Member'}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFilterChange('assignee', '')}
              />
            </Badge>
          )}
          
          {filters.sortBy !== 'dueDate' && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              Sort: {filters.sortBy === 'name' ? 'Name' : 'Difficulty'}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFilterChange('sortBy', 'dueDate')}
              />
            </Badge>
          )}
          
          {filters.searchQuery.trim() !== '' && (
            <Badge variant="outline" className="text-xs h-5 px-1.5">
              "{filters.searchQuery}"
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => onFilterChange('searchQuery', '')}
              />
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={onResetFilters} className="text-xs h-5 px-1.5 ml-1">
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};
