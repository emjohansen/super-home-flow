
import React, { useState } from 'react';
import { ChoreHistory as ChoreHistoryType } from '@/types/chore';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ChoreHistoryProps {
  historyEntries: ChoreHistoryType[];
  memberNames: Record<string, string>;
}

export const ChoreHistory: React.FC<ChoreHistoryProps> = ({ 
  historyEntries, 
  memberNames 
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayEntries = showAll ? historyEntries : historyEntries.slice(0, 5);
  
  if (historyEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No chore history yet. Complete some chores to see them here!
      </div>
    );
  }
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date Completed</TableHead>
            <TableHead>Chore</TableHead>
            <TableHead>Completed By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEntries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">
                {format(new Date(entry.completed_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>Chore ID: {entry.chore_id}</TableCell>
              <TableCell>
                {memberNames[entry.completed_by] || 'Unknown member'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {historyEntries.length > 5 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show All ({historyEntries.length} entries)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
