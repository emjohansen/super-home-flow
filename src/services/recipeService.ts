
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type Recipe = {
  id: string;
  name: string;
  description: string | null;
  prep_time: number | null;
  cook_time: number | null;
  is_public: boolean | null;
  image_url: string | null;
  created_by: string;
  household_id: string | null;
  instructions: string | null;
  servings: number | null;
  created_at?: string;
  updated_at?: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  notes: string | null;
  order_index: number | null;
};

export type RecipeWithIngredients = Recipe & {
  ingredients: RecipeIngredient[];
};

export const useRecipeService = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const fetchRecipes = async (isPublic: boolean = false) => {
    try {
      let query = supabase.from('recipes').select('*');
      
      if (!isPublic) {
        // Fetch household recipes
        query = query.eq('created_by', currentUser?.id);
      } else {
        // Fetch public recipes
        query = query.eq('is_public', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Error fetching recipes",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchRecipeById = async (id: string) => {
    try {
      // Fetch recipe details
      const { data: recipe, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!recipe) return null;

      // Fetch ingredients
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', id)
        .order('order_index', { ascending: true });

      if (ingredientsError) throw ingredientsError;

      return {
        ...recipe,
        ingredients: ingredients || []
      };
    } catch (error: any) {
      toast({
        title: "Error fetching recipe",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const createRecipe = async (recipe: Partial<Recipe>, ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to create recipes",
        variant: "destructive"
      });
      return null;
    }

    try {
      // First create the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert([{
          name: recipe.name,
          description: recipe.description || null,
          prep_time: recipe.prep_time || 0,
          cook_time: recipe.cook_time || 0,
          is_public: recipe.is_public || false,
          image_url: recipe.image_url || null,
          created_by: currentUser.id,
          household_id: recipe.household_id || null,
          instructions: recipe.instructions || null,
          servings: recipe.servings || null
        }])
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Then create ingredients if any
      if (ingredients.length > 0) {
        const ingredientsWithRecipeId = ingredients.map((ingredient, index) => ({
          recipe_id: recipeData.id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          notes: ingredient.notes,
          order_index: index
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsWithRecipeId);

        if (ingredientsError) throw ingredientsError;
      }

      toast({
        title: "Recipe created",
        description: "Your recipe has been created successfully"
      });

      return recipeData;
    } catch (error: any) {
      toast({
        title: "Error creating recipe",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updateRecipe = async (
    id: string, 
    recipe: Partial<Recipe>, 
    ingredients: (Omit<RecipeIngredient, 'recipe_id'> | Omit<RecipeIngredient, 'id' | 'recipe_id'>)[]
  ) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to update recipes",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Update the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .update({
          name: recipe.name,
          description: recipe.description,
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          is_public: recipe.is_public,
          image_url: recipe.image_url,
          household_id: recipe.household_id,
          instructions: recipe.instructions,
          servings: recipe.servings,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('created_by', currentUser.id) // Ensure user owns this recipe
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Delete existing ingredients
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (deleteError) throw deleteError;

      // Add updated ingredients
      if (ingredients.length > 0) {
        const ingredientsWithRecipeId = ingredients.map((ingredient, index) => ({
          recipe_id: id,
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
          notes: ingredient.notes,
          order_index: index
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsWithRecipeId);

        if (ingredientsError) throw ingredientsError;
      }

      toast({
        title: "Recipe updated",
        description: "Your recipe has been updated successfully"
      });

      return recipeData;
    } catch (error: any) {
      toast({
        title: "Error updating recipe",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to delete recipes",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Delete ingredients first (cascade should handle this, but being explicit)
      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id);

      if (ingredientsError) throw ingredientsError;

      // Delete the recipe
      const { error: recipeError } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('created_by', currentUser.id); // Ensure user owns this recipe

      if (recipeError) throw recipeError;

      toast({
        title: "Recipe deleted",
        description: "Your recipe has been deleted successfully"
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting recipe",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const togglePublicStatus = async (id: string, isPublic: boolean) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to update recipes",
        variant: "destructive"
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('recipes')
        .update({ is_public: isPublic })
        .eq('id', id)
        .eq('created_by', currentUser.id) // Ensure user owns this recipe
        .select()
        .single();

      if (error) throw error;

      toast({
        title: isPublic ? "Recipe made public" : "Recipe made private",
        description: `Your recipe is now ${isPublic ? "public" : "private"}`
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating recipe",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    fetchRecipes,
    fetchRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    togglePublicStatus
  };
};
