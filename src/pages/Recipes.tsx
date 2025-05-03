
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Clock, ChefHat } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// Recipe type
type Recipe = {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  isPublic: boolean;
  image: string;
  createdBy: string;
};

const Recipes = () => {
  const { translate } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState('household');

  // Mock recipes data
  useEffect(() => {
    // In a real app, this would fetch from a database
    const mockRecipes: Recipe[] = [
      {
        id: '1',
        name: 'Pasta Carbonara',
        description: 'Classic Italian pasta dish with eggs and bacon',
        prepTime: 10,
        cookTime: 15,
        isPublic: false,
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1771&q=80',
        createdBy: 'User 1',
      },
      {
        id: '2',
        name: 'Chicken Curry',
        description: 'Spicy chicken curry with rice',
        prepTime: 15,
        cookTime: 30,
        isPublic: true,
        image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1769&q=80',
        createdBy: 'User 2',
      },
      {
        id: '3',
        name: 'Caesar Salad',
        description: 'Fresh salad with romaine lettuce and Caesar dressing',
        prepTime: 15,
        cookTime: 0,
        isPublic: true,
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
        createdBy: 'User 3',
      },
    ];
    
    setRecipes(mockRecipes);
  }, []);

  // Filter recipes based on search query and tab
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'public' ? recipe.isPublic : !recipe.isPublic;
    return matchesSearch && matchesTab;
  });

  // Render a recipe card
  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <Card className="overflow-hidden group">
      <div className="relative h-40">
        <img 
          src={recipe.image} 
          alt={recipe.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3 text-white">
          <h3 className="font-medium">{recipe.name}</h3>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{recipe.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          <div className="flex items-center">
            <ChefHat className="h-3 w-3 mr-1" />
            <span>{recipe.createdBy}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{translate('recipes')}</h1>
        <Button className="bg-foodish-500 hover:bg-foodish-600">
          <Plus className="h-4 w-4 mr-2" />
          {translate('createNew')}
        </Button>
      </div>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={translate('search')}
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="household" onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 bg-foodish-50">
          <TabsTrigger value="household">Household</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
        </TabsList>
        
        <TabsContent value="household">
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <ChefHat className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No household recipes found</p>
              <Button variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Recipe
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="public">
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <ChefHat className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No public recipes found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Recipes;
