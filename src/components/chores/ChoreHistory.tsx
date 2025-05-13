
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
  choreNames: Record<string, string>;
}

export const ChoreHistory: React.FC<ChoreHistoryProps> = ({ 
  historyEntries, 
  memberNames,
  choreNames
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayEntries = showAll ? historyEntries : historyEntries.slice(0, 5);
  
  if (historyEntries.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No chore history yet. Complete some chores to see them here!
      </div>
    );
  }
  
  return (
    <div className="w-full overflow-hidden">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Date</TableHead>
            <TableHead className="w-1/3">Chore</TableHead>
            <TableHead className="w-1/3">Completed By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEntries.map((entry) => (
            <TableRow key={entry.id} className="h-10">
              <TableCell className="py-2">
                {format(new Date(entry.completed_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="py-2">
                {choreNames[entry.chore_id] || 'Unknown chore'}
              </TableCell>
              <TableCell className="py-2">
                {memberNames[entry.completed_by] || 'Unknown member'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {historyEntries.length > 5 && (
        <div className="flex justify-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="h-8 text-xs"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show All ({historyEntries.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
