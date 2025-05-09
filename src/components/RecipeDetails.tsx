import React, { useState } from "react";
import { Clock, Users, Edit, Trash2, Eye, EyeOff, Plus, Minus, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecipeWithIngredients } from "@/services/recipeService";
import { useAuth } from "@/contexts/AuthContext";
import { MEAL_TYPES, KEYWORDS, getMealTypeLabel, getKeywordLabel } from "@/utils/recipeCategories";

import {
  unitOptions, 
  getUnitCategory,
  getUnitSystem,
  convertUnit, 
  convertToSystem,
  UnitCategory,
  UnitSystem,
  scaleAmountByServings,
  formatAmount
} from "@/utils/unitConversions";
import { Separator } from "@/components/ui/separator";

interface RecipeDetailsProps {
  recipe: RecipeWithIngredients;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublic: () => void;
  onClose: () => void;
}

const RecipeDetails: React.FC<RecipeDetailsProps> = ({
  recipe,
  onEdit,
  onDelete,
  onTogglePublic,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.id === recipe.created_by;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  
  // For serving size adjustment
  const [servings, setServings] = useState(recipe.servings || 1);
  
  // For unit conversion
  const [unitSystem, setUnitSystem] = useState<UnitSystem | null>(null);

  // Parse instructions into steps - Improved to handle the format properly
  const parseInstructions = (instructions: string | null): { number: number; content: string }[] => {
    if (!instructions) return [];
    
    // Split by new lines and filter empty ones
    const lines = instructions.split('\n').filter(line => line.trim().length > 0);
    
    return lines.map((line, index) => {
      // Check if line starts with a number and period
      const match = line.match(/^(\d+)\.\s*(.*)/);
      if (match) {
        return {
          number: parseInt(match[1]),
          content: match[2]
        };
      }
      // If not formatted with numbers, add number
      return {
        number: index + 1,
        content: line
      };
    });
  };
  
  const instructionSteps = parseInstructions(recipe.instructions);
  
  // Helper function to increase/decrease servings
  const adjustServings = (amount: number) => {
    const newServing = Math.max(1, servings + amount);
    setServings(newServing);
  };
  
  // Functions for unit conversion
  const getConvertedAmount = (
    amount: number | null, 
    unit: string | null
  ): { amount: string; unit: string } => {
    if (amount === null || !unit) {
      return { amount: "", unit: unit || "" };
    }
    
    // First scale by servings
    const scaledAmount = scaleAmountByServings(
      amount, 
      recipe.servings || 1, 
      servings
    );
    
    if (scaledAmount === null) {
      return { amount: "", unit: unit };
    }
    
    // If unit system preference is set, convert to that system
    if (unitSystem && getUnitSystem(unit) !== 'none') {
      const converted = convertToSystem(scaledAmount, unit, unitSystem);
      
      if (converted !== null) {
        return { 
          amount: formatAmount(converted.amount), 
          unit: converted.unit
        };
      }
    }
    
    // If no conversion done, return the scaled amount
    return { 
      amount: formatAmount(scaledAmount), 
      unit: unit 
    };
  };
  
  // Reset unit system to show original units
  const resetUnitSystem = () => {
    setUnitSystem(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Fixed header with back button and actions */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button 
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onTogglePublic}
              >
                {recipe.is_public ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Make Private
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Make Public
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Recipe content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Recipe Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{recipe.name}</h1>
          {recipe.description && (
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Badges for meal type and keywords */}
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.meal_type && (
            <Badge className="bg-foodish-100 text-foodish-800 border-none">
              {getMealTypeLabel(recipe.meal_type)}
            </Badge>
          )}
          
          {recipe.keywords && recipe.keywords.map((keyword, index) => (
            <Badge key={index} variant="outline">
              {getKeywordLabel(keyword)}
            </Badge>
          ))}
        </div>

        {/* Recipe Meta Info */}
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Clock className="h-5 w-5 mr-2 text-foodish-500" />
            <span className="font-medium">
              {totalTime > 0 ? `${totalTime} min` : "Time not specified"}
            </span>
          </div>
          
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Users className="h-5 w-5 mr-2 text-foodish-500" />
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full p-0"
                onClick={() => adjustServings(-1)}
                disabled={servings <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="px-2 font-medium">{servings}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full p-0"
                onClick={() => adjustServings(1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <span className="ml-1">servings</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Ingredients Column */}
          <div className="md:col-span-5">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Ingredients</h2>
                  <div className="flex gap-1">
                    <Button 
                      variant={unitSystem === null ? "default" : "outline"} 
                      size="sm"
                      onClick={resetUnitSystem}
                      className="text-xs h-7 px-2"
                    >
                      Original
                    </Button>
                    <Button 
                      variant={unitSystem === 'metric' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setUnitSystem('metric')}
                      className="text-xs h-7 px-2"
                    >
                      Metric
                    </Button>
                    <Button 
                      variant={unitSystem === 'imperial' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setUnitSystem('imperial')}
                      className="text-xs h-7 px-2"
                    >
                      Imperial
                    </Button>
                  </div>
                </div>
              
                {recipe.ingredients?.length > 0 ? (
                  <ul className="space-y-3">
                    {recipe.ingredients.map((ingredient) => {
                      const convertedValue = getConvertedAmount(
                        ingredient.amount, 
                        ingredient.unit
                      );
                      
                      return (
                        <li 
                          key={ingredient.id} 
                          className="flex justify-between items-baseline pb-2 border-b border-gray-100"
                        >
                          <span className="font-medium">{ingredient.name}</span>
                          <span className="text-gray-600 text-right">
                            {convertedValue.amount && (
                              <>
                                {convertedValue.amount} {convertedValue.unit}
                                {ingredient.notes && (
                                  <span className="block text-gray-500 text-sm">
                                    {ingredient.notes}
                                  </span>
                                )}
                              </>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No ingredients listed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions Column */}
          <div className="md:col-span-7">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                
                {instructionSteps.length > 0 ? (
                  <div className="space-y-6">
                    {instructionSteps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foodish-500 flex items-center justify-center text-white font-medium">
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-700">{step.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No instructions added
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
