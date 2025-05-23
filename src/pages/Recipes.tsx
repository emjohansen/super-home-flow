import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Clock, 
  ChefHat, 
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Utensils,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import RecipeForm from '@/components/RecipeForm';
import RecipeDetails from '@/components/RecipeDetails';
import { useRecipeService, Recipe } from '@/services/recipeService';
import { useToast } from '@/hooks/use-toast';
import RecipeFilters from '@/components/RecipeFilters';
import { getMealTypeLabel, getKeywordLabel } from '@/utils/recipeCategories';

const Recipes = () => {
  const { translate } = useLanguage();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const recipeService = useRecipeService();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState('household');
  const [loading, setLoading] = useState(true);
  
  // Filtering state - Updated to support multiple selections
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  
  // UI state
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load recipes on tab change or when recipes are modified
  useEffect(() => {
    fetchRecipes();
  }, [activeTab, currentUser]);

  const fetchRecipes = async () => {
    setLoading(true);
    const isPublic = activeTab === 'public';
    const fetchedRecipes = await recipeService.fetchRecipes(isPublic);
    setRecipes(fetchedRecipes);
    setLoading(false);
  };

  // Filter recipes based on search query, meal types, and keywords
  const filteredRecipes = recipes.filter(recipe => {
    // Text search filter
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Meal type filter - Check if any selected meal type is in the recipe's meal types
    const matchesMealType = selectedMealTypes.length === 0 || 
      (recipe.meal_type && recipe.meal_type.some(type => selectedMealTypes.includes(type)));
    
    // Keyword filter - Check if any selected keyword is in the recipe's keywords
    const matchesKeyword = selectedKeywords.length === 0 || 
      (recipe.keywords && recipe.keywords.some(keyword => selectedKeywords.includes(keyword)));
    
    return matchesSearch && matchesMealType && matchesKeyword;
  });

  const clearFilters = () => {
    setSelectedMealTypes([]);
    setSelectedKeywords([]);
  };

  // Recipe actions
  const handleViewRecipe = async (recipeId: string) => {
    const recipe = await recipeService.fetchRecipeById(recipeId);
    if (recipe) {
      setSelectedRecipe(recipe);
      setSelectedRecipeId(recipeId);
      setIsViewDialogOpen(true);
    }
  };

  const handleCreateRecipe = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Pass data directly (the service will format instructions)
      const result = await recipeService.createRecipe(data);
      if (result) {
        setIsCreateDialogOpen(false);
        fetchRecipes();
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRecipe = () => {
    setIsViewDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRecipe = async (data: any) => {
    if (!selectedRecipeId) return;
    
    setIsSubmitting(true);
    
    try {
      // Pass data directly (the service will format instructions)
      const result = await recipeService.updateRecipe(selectedRecipeId, data);
      if (result) {
        setIsEditDialogOpen(false);
        fetchRecipes();
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setIsViewDialogOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRecipeId) return;
    
    try {
      const result = await recipeService.deleteRecipe(selectedRecipeId);
      if (result) {
        // Close all dialogs when delete is successful
        setIsDeleteDialogOpen(false);
        setIsViewDialogOpen(false);
        setSelectedRecipeId(null);
        setSelectedRecipe(null);
        fetchRecipes();
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleTogglePublic = async () => {
    if (!selectedRecipe) return;
    
    const newStatus = !selectedRecipe.is_public;
    const result = await recipeService.togglePublicStatus(selectedRecipe.id, newStatus);
    
    if (result) {
      setSelectedRecipe({ ...selectedRecipe, is_public: newStatus });
      fetchRecipes();
    }
  };

  // Render a recipe card
  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <Card 
      className="overflow-hidden group cursor-pointer hover:shadow-md transition-all"
      onClick={() => handleViewRecipe(recipe.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium line-clamp-1">{recipe.name}</h3>
          {currentUser?.id === recipe.created_by && (
            <div className="text-gray-400">
              {recipe.is_public ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
        
        {/* Meal type badge - Updated to handle multiple meal types */}
        {recipe.meal_type && recipe.meal_type.length > 0 && (
          <div className="mb-2">
            {recipe.meal_type.map((type, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="bg-foodish-100 text-foodish-800 mr-1"
              >
                {getMealTypeLabel(type)}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Keywords */}
        {recipe.keywords && recipe.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {recipe.keywords.slice(0, 2).map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {getKeywordLabel(keyword)}
              </Badge>
            ))}
            {recipe.keywords.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.keywords.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        <div className="mb-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {recipe.description || 'No description available'}
          </p>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1 text-foodish-500" />
              <span>{(recipe.prep_time || 0) + (recipe.cook_time || 0)} min</span>
            </div>
            <div className="flex items-center">
              <Utensils className="h-3.5 w-3.5 mr-1 text-foodish-500" />
              <span>Recipe</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ isPublic = false }) => (
    <div className="text-center py-10 text-gray-500">
      <ChefHat className="h-10 w-10 mx-auto mb-2 text-gray-300" />
      <p>No {isPublic ? 'public' : 'household'} recipes found</p>
      {!isPublic && (
        <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Recipe
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{translate('recipes')}</h1>
        <Button className="bg-foodish-500 hover:bg-foodish-600" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {translate('createNew')}
        </Button>
      </div>
      
      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={translate('search')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <RecipeFilters
            selectedMealTypes={selectedMealTypes}
            selectedKeywords={selectedKeywords}
            setSelectedMealTypes={setSelectedMealTypes}
            setSelectedKeywords={setSelectedKeywords}
            clearFilters={clearFilters}
          />
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="household" onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 bg-foodish-50">
          <TabsTrigger value="household">Household</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
        </TabsList>
        
        <TabsContent value="household">
          {loading ? (
            <div className="text-center py-10">
              <p>Loading recipes...</p>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>
        
        <TabsContent value="public">
          {loading ? (
            <div className="text-center py-10">
              <p>Loading public recipes...</p>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <EmptyState isPublic={true} />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Recipe Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Recipe</DialogTitle>
          </DialogHeader>
          <RecipeForm
            onSubmit={handleCreateRecipe}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Recipe Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          <RecipeForm
            recipe={selectedRecipe}
            onSubmit={handleUpdateRecipe}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* View Recipe Dialog - With Make Public button removed from top */}
      {isViewDialogOpen && selectedRecipe && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-full w-full h-[100vh] m-0 p-0 rounded-none">
            <RecipeDetails
              recipe={selectedRecipe}
              onEdit={handleEditRecipe}
              onDelete={handleDeleteClick}
              onTogglePublic={handleTogglePublic}
              onClose={() => setIsViewDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this recipe and all its ingredients.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Recipes;
