
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X, ChevronDown } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { MEAL_TYPES, KEYWORDS, getMealTypeLabel, getKeywordLabel } from '@/utils/recipeCategories';

interface RecipeFiltersProps {
  selectedMealTypes: string[];
  selectedKeywords: string[];
  setSelectedMealTypes: (value: string[]) => void;
  setSelectedKeywords: (value: string[]) => void;
  clearFilters: () => void;
}

const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  selectedMealTypes,
  selectedKeywords,
  setSelectedMealTypes,
  setSelectedKeywords,
  clearFilters
}) => {
  const hasActiveFilters = selectedMealTypes.length > 0 || selectedKeywords.length > 0;
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isAppliedFiltersOpen, setIsAppliedFiltersOpen] = React.useState(true);
  
  // Toggle a meal type selection
  const toggleMealType = (type: string) => {
    if (selectedMealTypes.includes(type)) {
      setSelectedMealTypes(selectedMealTypes.filter(t => t !== type));
    } else {
      setSelectedMealTypes([...selectedMealTypes, type]);
    }
  };
  
  // Toggle a keyword selection
  const toggleKeyword = (keyword: string) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };
  
  // Remove a specific meal type
  const removeMealType = (type: string) => {
    setSelectedMealTypes(selectedMealTypes.filter(t => t !== type));
  };
  
  // Remove a specific keyword
  const removeKeyword = (keyword: string) => {
    setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
  };
  
  return (
    <div className="w-full">
      <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              <span>Filters</span>
            </div>
            {hasActiveFilters && 
              <Badge className="ml-2 bg-foodish-500">{selectedMealTypes.length + selectedKeywords.length}</Badge>
            }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[280px] p-0" align="end">
          <div className="p-4 border-b">
            <h3 className="font-medium mb-2">Meal Types</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {MEAL_TYPES.map(type => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`meal-type-${type.value}`}
                    checked={selectedMealTypes.includes(type.value)}
                    onCheckedChange={() => toggleMealType(type.value)}
                  />
                  <label 
                    htmlFor={`meal-type-${type.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 border-b">
            <h3 className="font-medium mb-2">Keywords</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {KEYWORDS.map(keyword => (
                <div key={keyword.value} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`keyword-${keyword.value}`}
                    checked={selectedKeywords.includes(keyword.value)}
                    onCheckedChange={() => toggleKeyword(keyword.value)}
                  />
                  <label 
                    htmlFor={`keyword-${keyword.value}`}
                    className="text-sm leading-none cursor-pointer"
                  >
                    {keyword.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="p-4">
              <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Applied Filters - Collapsible Section */}
      {hasActiveFilters && (
        <Collapsible open={isAppliedFiltersOpen} onOpenChange={setIsAppliedFiltersOpen} className="mt-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Applied Filters</p>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                <ChevronDown className={`h-4 w-4 transition-transform ${isAppliedFiltersOpen ? 'transform rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMealTypes.map(type => (
                <Badge key={type} variant="secondary" className="flex items-center gap-1 bg-foodish-100 text-foodish-800">
                  {getMealTypeLabel(type)}
                  <button 
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5 flex items-center justify-center" 
                    onClick={() => removeMealType(type)}
                    aria-label={`Remove ${getMealTypeLabel(type)} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {selectedKeywords.map(keyword => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1 bg-foodish-50 border border-foodish-200 text-foodish-800">
                  {getKeywordLabel(keyword)}
                  <button 
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5 flex items-center justify-center" 
                    onClick={() => removeKeyword(keyword)}
                    aria-label={`Remove ${getKeywordLabel(keyword)} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-gray-600 hover:text-gray-900" 
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default RecipeFilters;
