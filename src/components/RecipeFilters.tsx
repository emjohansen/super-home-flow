
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MEAL_TYPES, KEYWORDS, getMealTypeLabel, getKeywordLabel } from '@/utils/recipeCategories';

interface RecipeFiltersProps {
  selectedMealType: string | null;
  selectedKeyword: string | null;
  setSelectedMealType: (value: string | null) => void;
  setSelectedKeyword: (value: string | null) => void;
  clearFilters: () => void;
}

const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  selectedMealType,
  selectedKeyword,
  setSelectedMealType,
  setSelectedKeyword,
  clearFilters
}) => {
  const hasActiveFilters = selectedMealType || selectedKeyword;
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full flex-1">
            <Filter className="h-4 w-4 mr-2" />
            Filters {hasActiveFilters && <Badge className="ml-2 bg-foodish-500">!</Badge>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[240px]" align="end">
          <div className="p-2">
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium">Meal Type</p>
              <Select 
                value={selectedMealType || ''} 
                onValueChange={(value) => setSelectedMealType(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All meal types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All meal types</SelectItem>
                  {MEAL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <p className="mb-1 text-sm font-medium">Keywords</p>
              <Select 
                value={selectedKeyword || ''} 
                onValueChange={(value) => setSelectedKeyword(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All keywords" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All keywords</SelectItem>
                  {KEYWORDS.map(keyword => (
                    <SelectItem key={keyword.value} value={keyword.value}>{keyword.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {hasActiveFilters && (
              <Button variant="outline" className="w-full" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Applied Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedMealType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getMealTypeLabel(selectedMealType)}
              <button 
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5" 
                onClick={() => setSelectedMealType(null)}
              >
                ✕
              </button>
            </Badge>
          )}
          {selectedKeyword && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getKeywordLabel(selectedKeyword)}
              <button 
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5" 
                onClick={() => setSelectedKeyword(null)}
              >
                ✕
              </button>
            </Badge>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      )}
    </>
  );
};

export default RecipeFilters;
