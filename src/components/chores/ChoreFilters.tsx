
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
import { X } from 'lucide-react';

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
  return (
    <div className="bg-card rounded-md border p-4 mb-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <div>
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange('status', value)}
          >
            <SelectTrigger>
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
            <SelectTrigger>
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
            <SelectTrigger>
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
            />
            {filters.searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => onFilterChange('searchQuery', '')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {(filters.status !== 'all' || 
         filters.assignee !== '' || 
         filters.sortBy !== 'dueDate' || 
         filters.searchQuery.trim() !== '') && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-wrap gap-2">
            {filters.status !== 'all' && (
              <Badge variant="secondary">
                Status: {filters.status.charAt(0).toUpperCase() + filters.status.slice(1)}
              </Badge>
            )}
            
            {filters.assignee !== '' && (
              <Badge variant="secondary">
                Assignee: {
                  filters.assignee === 'unassigned' 
                    ? 'Unassigned' 
                    : members.find(m => m.id === filters.assignee)?.display_name || 'Selected member'
                }
              </Badge>
            )}
            
            {filters.sortBy !== 'dueDate' && (
              <Badge variant="secondary">
                Sorted by: {
                  filters.sortBy === 'name' 
                    ? 'Name' 
                    : filters.sortBy === 'difficulty' 
                      ? 'Difficulty' 
                      : 'Due Date'
                }
              </Badge>
            )}
            
            {filters.searchQuery.trim() !== '' && (
              <Badge variant="secondary">
                Search: {filters.searchQuery}
              </Badge>
            )}
          </div>
          
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};
