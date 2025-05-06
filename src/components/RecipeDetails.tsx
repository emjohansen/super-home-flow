
import React from "react";
import { Clock, Users, ChefHat, Edit, Trash2, Eye, EyeOff } from "lucide-react";
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
import { RecipeWithIngredients } from "@/services/recipeService";
import { useAuth } from "@/contexts/AuthContext";

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

              {recipe.servings && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}

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

            <Card className="mt-6">
              <CardContent className="p-0">
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
                      recipe.ingredients.map((ingredient) => (
                        <TableRow key={ingredient.id}>
                          <TableCell>{ingredient.name}</TableCell>
                          <TableCell>
                            {ingredient.amount}{" "}
                            {ingredient.unit ? ingredient.unit : ""}
                          </TableCell>
                          <TableCell>{ingredient.notes || ""}</TableCell>
                        </TableRow>
                      ))
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

            {recipe.instructions && (
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-3">Instructions</h2>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {recipe.instructions.split("\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
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
