
import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RecipeWithIngredients } from "@/services/recipeService";
import { unitOptions } from "@/utils/unitConversions";
import { MEAL_TYPES, KEYWORDS } from "@/utils/recipeCategories";

// Schema for a single instruction step
const instructionStepSchema = z.object({
  content: z.string().min(1, "Step content is required"),
});

// Form validation schema
const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  prep_time: z.coerce.number().int().nonnegative().optional(),
  cook_time: z.coerce.number().int().nonnegative().optional(),
  is_public: z.boolean().default(false),
  servings: z.coerce.number().int().positive().optional(),
  instructions: z.array(instructionStepSchema),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, "Ingredient name is required"),
      amount: z.coerce.number().optional().nullable(),
      unit: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ),
  // Updated to allow multiple meal types
  meal_types: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

type RecipeFormValues = z.infer<typeof recipeSchema>;

interface RecipeFormProps {
  recipe?: RecipeWithIngredients;
  onSubmit: (data: RecipeFormValues) => Promise<void>;
  isSubmitting: boolean;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  recipe,
  onSubmit,
  isSubmitting,
}) => {
  // Parse instructions from string to array of steps
  const parseInstructions = (instructions: string | null | undefined): { content: string }[] => {
    if (!instructions) return [{ content: "" }];
    
    // Split by new line, filter empty lines, and convert to objects
    return instructions
      .split("\n")
      .filter(line => line.trim().length > 0)
      .map(content => ({ content }));
  };

  // Transform single meal_type to array for multi-select
  const getMealTypesArray = (mealType: string | null | undefined): string[] => {
    if (!mealType) return [];
    return [mealType];
  };

  const defaultValues: RecipeFormValues = {
    name: recipe?.name || "",
    description: recipe?.description || "",
    prep_time: recipe?.prep_time || 0,
    cook_time: recipe?.cook_time || 0,
    is_public: recipe?.is_public || false,
    servings: recipe?.servings || 2,
    instructions: parseInstructions(recipe?.instructions),
    ingredients: recipe?.ingredients?.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      notes: ing.notes,
    })) || [{ name: "", amount: null, unit: null, notes: null }],
    meal_types: getMealTypesArray(recipe?.meal_type),
    keywords: recipe?.keywords || [],
  };

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const { fields: instructionFields, append: appendInstruction, remove: removeInstruction, move: moveInstruction } = useFieldArray({
    control: form.control,
    name: "instructions",
  });

  // Filter out any options with empty values
  const filteredUnitOptions = unitOptions.filter(option => option.value !== "");

  // Transform form data before submission to match API expectations
  const handleSubmit = async (data: RecipeFormValues) => {
    // Convert multi-select meal_types array to single meal_type string (first selected)
    const transformedData = {
      ...data,
      meal_type: data.meal_types && data.meal_types.length > 0 ? data.meal_types[0] : null
    };
    
    // Remove meal_types as it's not in the API
    delete (transformedData as any).meal_types;
    
    await onSubmit(transformedData);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Delicious Recipe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of your recipe"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Multi-select Meal Type Selection */}
              <div>
                <FormLabel>Meal Type</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 border rounded-md p-4">
                  <Controller
                    control={form.control}
                    name="meal_types"
                    render={({ field }) => (
                      <>
                        {MEAL_TYPES.map((type) => (
                          <div key={type.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={(field.value || []).includes(type.value)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                const updatedValue = checked
                                  ? [...currentValue, type.value]
                                  : currentValue.filter((value) => value !== type.value);
                                field.onChange(updatedValue);
                              }}
                              id={`meal-type-${type.value}`}
                            />
                            <label
                              htmlFor={`meal-type-${type.value}`}
                              className="text-sm cursor-pointer"
                            >
                              {type.label}
                            </label>
                          </div>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>

              {/* Keywords Selection */}
              <div>
                <FormLabel>Keywords</FormLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2 border rounded-md p-4">
                  <Controller
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <>
                        {KEYWORDS.map((keyword) => (
                          <div key={keyword.value} className="flex items-center space-x-2">
                            <Checkbox
                              checked={(field.value || []).includes(keyword.value)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value || [];
                                const updatedValue = checked
                                  ? [...currentValue, keyword.value]
                                  : currentValue.filter((value) => value !== keyword.value);
                                field.onChange(updatedValue);
                              }}
                              id={`keyword-${keyword.value}`}
                            />
                            <label
                              htmlFor={`keyword-${keyword.value}`}
                              className="text-sm cursor-pointer"
                            >
                              {keyword.label}
                            </label>
                          </div>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prep_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="15"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cook_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cook Time (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-end h-full">
                      <div className="flex items-center space-x-2">
                        <FormLabel>Public Recipe</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Ingredients section - redesigned to be more compact */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Ingredients</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendIngredient({
                        name: "",
                        amount: null,
                        unit: null,
                        notes: null,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Ingredient
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {ingredientFields.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No ingredients added yet
                      </div>
                    ) : (
                      <div className="divide-y">
                        {ingredientFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-2 grid grid-cols-12 gap-1 items-center"
                          >
                            <div className="col-span-5 md:col-span-4">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.name`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        placeholder="Ingredient"
                                        {...field}
                                        className="h-8 text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-3 md:col-span-2">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.amount`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Amt"
                                        {...field}
                                        value={field.value ?? ""}
                                        className="h-8 text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-3 md:col-span-3">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.unit`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value || undefined}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {filteredUnitOptions.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="hidden md:block md:col-span-2">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.notes`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        placeholder="Notes"
                                        {...field}
                                        value={field.value ?? ""}
                                        className="h-8 text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeIngredient(index)}
                                className="h-6 w-6"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                            
                            {/* Notes field for mobile */}
                            <div className="col-span-12 md:hidden mt-1">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.notes`}
                                render={({ field }) => (
                                  <FormItem className="mb-0">
                                    <FormControl>
                                      <Input
                                        placeholder="Notes"
                                        {...field}
                                        value={field.value ?? ""}
                                        className="h-8 text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              {/* Step-by-step instructions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Instructions (Step by Step)</h3>
                </div>

                <Card>
                  <CardContent className="p-0">
                    {instructionFields.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No instructions added yet
                      </div>
                    ) : (
                      <div className="divide-y">
                        {instructionFields.map((field, index) => (
                          <div key={field.id} className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foodish-500 flex items-center justify-center text-white font-medium">
                                {index + 1}
                              </div>
                              <h4 className="font-medium">Step {index + 1}</h4>
                              <div className="ml-auto flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => index > 0 && moveInstruction(index, index - 1)}
                                  disabled={index === 0}
                                  className="h-7 w-7"
                                >
                                  <ArrowUpDown className="h-3 w-3 rotate-90" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeInstruction(index)}
                                  className="h-7 w-7"
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`instructions.${index}.content`}
                              render={({ field }) => (
                                <FormItem className="mb-0">
                                  <FormControl>
                                    <Textarea
                                      placeholder={`Describe step ${index + 1}...`}
                                      {...field}
                                      className="min-h-[60px] resize-none"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                        
                        {/* Add Step button moved to bottom of steps */}
                        <div className="p-3 flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => appendInstruction({ content: "" })}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Step
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : recipe
                ? "Update Recipe"
                : "Create Recipe"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RecipeForm;
