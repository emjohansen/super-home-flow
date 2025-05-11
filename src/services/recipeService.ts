import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  notes: string | null;
}

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  created_by: string;
  household_id: string | null;
  is_public: boolean;
  meal_type: string[] | null;
  keywords: string[] | null;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Ingredient[];
}

export function useRecipeService() {
  const { currentUser } = useAuth();
  const { currentHousehold } = useHousehold();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const fetchRecipes = async (isPublic = false): Promise<Recipe[]> => {
    try {
      let query = supabase.from('recipes').select('*');
      
      if (isPublic) {
        query = query.eq('is_public', true);
      } else if (currentHousehold) {
        query = query.eq('household_id', currentHousehold.id);
      } else if (currentUser) {
        query = query.eq('created_by', currentUser.id);
      } else {
        return [];
      }
      
      const { data, error } = await query.order('name', { ascending: true });
      
      if (error) throw error;
      
      // Convert data to Recipe[] with correct fields
      return data.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        created_by: recipe.created_by,
        household_id: recipe.household_id,
        is_public: recipe.is_public || false,
        meal_type: recipe.meal_type || null,
        keywords: recipe.keywords || null
      }));
    } catch (error: any) {
      console.error('Error fetching recipes:', error.message);
      return [];
    }
  };
  
  const fetchRecipeById = async (id: string): Promise<RecipeWithIngredients | null> => {
    try {
      // Fetch recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (recipeError) throw recipeError;
      if (!recipe) return null;
      
      // Fetch ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', id)
        .order('name', { ascending: true });
      
      if (ingredientsError) throw ingredientsError;
      
      return {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        created_by: recipe.created_by,
        household_id: recipe.household_id,
        is_public: recipe.is_public || false,
        meal_type: recipe.meal_type || null,
        keywords: recipe.keywords || null,
        ingredients: ingredients || []
      };
    } catch (error: any) {
      console.error('Error fetching recipe:', error.message);
      return null;
    }
  };
  
  const createRecipe = async (recipeData: any): Promise<Recipe | null> => {
    setLoading(true);
    
    try {
      const userId = currentUser?.id;
      const householdId = currentHousehold?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Extract ingredients from the form data
      const { ingredients, ...recipeFields } = recipeData;
      
      // Format instructions to be saved as plain text without numbering
      if (recipeFields.instructions && Array.isArray(recipeFields.instructions)) {
        recipeFields.instructions = recipeFields.instructions
          .map((step: { content: string }) => step.content)
          .join('\n');
      }
      
      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          ...recipeFields,
          created_by: userId,
          household_id: householdId,
        })
        .select()
        .single();
      
      if (recipeError) throw recipeError;
      if (!recipe) throw new Error('Failed to create recipe');
      
      // Create ingredients
      if (ingredients && ingredients.length > 0) {
        const ingredientsWithRecipeId = ingredients.map((ingredient: any) => ({
          ...ingredient,
          recipe_id: recipe.id
        }));
        
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsWithRecipeId);
        
        if (ingredientsError) throw ingredientsError;
      }
      
      toast({
        title: 'Success',
        description: 'Recipe created successfully',
      });
      
      return {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        created_by: recipe.created_by,
        household_id: recipe.household_id,
        is_public: recipe.is_public || false,
        meal_type: recipe.meal_type || null,
        keywords: recipe.keywords || null
      };
    } catch (error: any) {
      console.error('Error creating recipe:', error.message);
      toast({
        title: 'Error',
        description: `Failed to create recipe: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateRecipe = async (id: string, recipeData: any): Promise<Recipe | null> => {
    setLoading(true);
    
    try {
      const userId = currentUser?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Extract ingredients from the form data
      const { ingredients, ...recipeFields } = recipeData;
      
      // Format instructions to be saved as plain text without numbering
      if (recipeFields.instructions && Array.isArray(recipeFields.instructions)) {
        recipeFields.instructions = recipeFields.instructions
          .map((step: { content: string }) => step.content)
          .join('\n');
      }
      
      // Update recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .update(recipeFields)
        .eq('id', id)
        .select()
        .single();
      
      if (recipeError) throw recipeError;
      if (!recipe) throw new Error('Failed to update recipe');
      
      // Delete existing ingredients
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);
      
      if (deleteError) throw deleteError;
      
      // Create new ingredients
      if (ingredients && ingredients.length > 0) {
        const ingredientsWithRecipeId = ingredients.map((ingredient: any) => ({
          ...ingredient,
          recipe_id: id
        }));
        
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsWithRecipeId);
        
        if (ingredientsError) throw ingredientsError;
      }
      
      toast({
        title: 'Success',
        description: 'Recipe updated successfully',
      });
      
      return {
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        created_by: recipe.created_by,
        household_id: recipe.household_id,
        is_public: recipe.is_public || false,
        meal_type: recipe.meal_type || null,
        keywords: recipe.keywords || null
      };
    } catch (error: any) {
      console.error('Error updating recipe:', error.message);
      toast({
        title: 'Error',
        description: `Failed to update recipe: ${error.message}`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteRecipe = async (id: string): Promise<boolean> => {
    try {
      // First delete any ingredients associated with this recipe
      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);
      
      if (ingredientsError) throw ingredientsError;
      
      // Then delete the recipe itself
      const { error: recipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      
      if (recipeError) throw recipeError;
      
      toast({
        title: 'Success',
        description: 'Recipe deleted successfully',
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting recipe:', error.message);
      toast({
        title: 'Error',
        description: `Failed to delete recipe: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    }
  };
  
  const togglePublicStatus = async (id: string, isPublic: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ is_public: isPublic })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Recipe is now ${isPublic ? 'public' : 'private'}`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error updating recipe visibility:', error.message);
      toast({
        title: 'Error',
        description: `Failed to update visibility: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    }
  };
  
  return {
    loading,
    fetchRecipes,
    fetchRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    togglePublicStatus,
  };
}
