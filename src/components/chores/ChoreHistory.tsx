
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
      <div className="text-center py-2 text-muted-foreground text-sm">
        No chore history yet. Complete some chores to see them here!
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <Table className="w-full border-collapse">
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="w-1/4 py-1 px-2 text-xs">Date</TableHead>
            <TableHead className="w-2/5 py-1 px-2 text-xs">Chore</TableHead>
            <TableHead className="w-1/3 py-1 px-2 text-xs">By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEntries.map((entry) => (
            <TableRow key={entry.id} className="h-8 border-b">
              <TableCell className="py-1 px-2 text-xs">
                {format(new Date(entry.completed_at), 'MMM d')}
              </TableCell>
              <TableCell className="py-1 px-2 text-xs truncate max-w-[150px]">
                {choreNames[entry.chore_id] || 'Unknown chore'}
              </TableCell>
              <TableCell className="py-1 px-2 text-xs truncate">
                {memberNames[entry.completed_by] || 'Unknown member'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {historyEntries.length > 5 && (
        <div className="flex justify-center mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="h-6 text-xs"
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
