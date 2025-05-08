
import React, { useState } from "react";
import { Clock, Users, ChefHat, Edit, Trash2, Eye, EyeOff, ArrowsUpFromLine, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecipeWithIngredients } from "@/services/recipeService";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface RecipeDetailsProps {
  recipe: RecipeWithIngredients;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublic: () => void;
}

const RecipeDetails: React.FC<RecipeDetailsProps> = ({
  recipe,
  onEdit,
  onDelete,
  onTogglePublic,
}) => {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.id === recipe.created_by;
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  
  // For serving size adjustment
  const [servings, setServings] = useState(recipe.servings || 1);
  
  // For unit conversion
  const [unitSystem, setUnitSystem] = useState<UnitSystem | null>(null);

  // Parse instructions into steps
  const parseInstructions = (instructions: string | null): { number: number; content: string }[] => {
    if (!instructions) return [];
    
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Recipe image */}
        <div className="w-full md:w-1/3">
          {recipe.image_url ? (
            <div className="aspect-square relative rounded-lg overflow-hidden">
              <img
                src={recipe.image_url}
                alt={recipe.name}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <ChefHat className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {isOwner && (
            <div className="mt-4 flex flex-col md:flex-row gap-2">
              <Button variant="outline" className="w-full" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onTogglePublic}
              >
                {recipe.is_public ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Make Private
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Make Public
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Recipe details */}
        <div className="w-full md:w-2/3">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{recipe.name}</h1>
              {recipe.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {recipe.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm font-medium">
              {totalTime > 0 && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{totalTime} min</span>
                </div>
              )}

              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-6 w-6 rounded-full"
                    onClick={() => adjustServings(-1)}
                    disabled={servings <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="min-w-[3ch] text-center">
                    {servings}
                  </span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-6 w-6 rounded-full"
                    onClick={() => adjustServings(1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <span className="ml-1">servings</span>
                </div>
              </div>

              {recipe.is_public !== null && (
                <div className="flex items-center">
                  {recipe.is_public ? (
                    <Eye className="h-4 w-4 mr-1" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-1" />
                  )}
                  <span>{recipe.is_public ? "Public" : "Private"}</span>
                </div>
              )}
            </div>

            {/* Ingredients with unit conversion */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Ingredients</h2>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant={unitSystem === null ? "default" : "outline"} 
                      size="sm"
                      onClick={resetUnitSystem}
                    >
                      Original
                    </Button>
                    <Button 
                      variant={unitSystem === 'metric' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setUnitSystem('metric')}
                    >
                      Metric
                    </Button>
                    <Button 
                      variant={unitSystem === 'imperial' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setUnitSystem('imperial')}
                    >
                      Imperial
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Ingredient</TableHead>
                      <TableHead className="w-1/4">Amount</TableHead>
                      <TableHead className="w-1/4">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipe.ingredients?.length > 0 ? (
                      recipe.ingredients.map((ingredient) => {
                        const convertedValue = getConvertedAmount(
                          ingredient.amount, 
                          ingredient.unit
                        );
                        
                        return (
                          <TableRow key={ingredient.id}>
                            <TableCell>{ingredient.name}</TableCell>
                            <TableCell>
                              {convertedValue.amount}{" "}
                              {convertedValue.unit}
                            </TableCell>
                            <TableCell>{ingredient.notes || ""}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4">
                          No ingredients listed
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Step by step instructions */}
            {instructionSteps.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">Instructions</h2>
                <div className="space-y-4">
                  {instructionSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foodish-500 flex items-center justify-center text-white font-medium">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 dark:text-gray-300">{step.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
