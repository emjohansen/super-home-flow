
import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, ChefHat } from "lucide-react";
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
import { RecipeWithIngredients } from "@/services/recipeService";

// Form validation schema
const recipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  prep_time: z.coerce.number().int().nonnegative().optional(),
  cook_time: z.coerce.number().int().nonnegative().optional(),
  is_public: z.boolean().default(false),
  servings: z.coerce.number().int().positive().optional(),
  instructions: z.string().optional(),
  image_url: z.string().optional(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, "Ingredient name is required"),
      amount: z.coerce.number().optional().nullable(),
      unit: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ),
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
  const [imageUrl, setImageUrl] = useState<string>(recipe?.image_url || "");

  const defaultValues: RecipeFormValues = {
    name: recipe?.name || "",
    description: recipe?.description || "",
    prep_time: recipe?.prep_time || 0,
    cook_time: recipe?.cook_time || 0,
    is_public: recipe?.is_public || false,
    servings: recipe?.servings || 2,
    instructions: recipe?.instructions || "",
    image_url: recipe?.image_url || "",
    ingredients: recipe?.ingredients?.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      notes: ing.notes,
    })) || [{ name: "", amount: null, unit: null, notes: null }],
  };

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    form.setValue("image_url", url);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Step-by-step instructions"
                        className="min-h-[200px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleUrlChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {imageUrl ? (
                <div className="relative h-48 rounded-md overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Recipe preview"
                    className="w-full h-full object-cover"
                    onError={() => setImageUrl("")}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                  <ChefHat className="h-12 w-12 text-gray-400" />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Ingredients</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
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
                    {fields.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No ingredients added yet
                      </div>
                    ) : (
                      <div className="divide-y">
                        {fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-4 grid grid-cols-12 gap-2 items-center"
                          >
                            <div className="col-span-5">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="Ingredient"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-2">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.amount`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="Amt"
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-2">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.unit`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="Unit"
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-2">
                              <FormField
                                control={form.control}
                                name={`ingredients.${index}.notes`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        placeholder="Notes"
                                        {...field}
                                        value={field.value ?? ""}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="col-span-1 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
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
