
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  badge
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mb-4">
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className={cn("pt-1 transition-all", isOpen ? "animate-accordion-down" : "animate-accordion-up")}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};
