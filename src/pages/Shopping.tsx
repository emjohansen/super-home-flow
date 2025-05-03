
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, ShoppingBag, X, Store, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Avatar from '@/components/Avatar';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for our data
type Store = {
  id: string;
  name: string;
  household_id: string | null;
};

type ShoppingItem = {
  id: string;
  name: string;
  store_id: string | null;
  is_collected: boolean;
  created_by: string;
  is_private: boolean;
  price?: number | null;
  quantity?: number | null;
  unit?: string | null;
  shopping_list_id: string;
};

type ShoppingList = {
  id: string;
  name: string;
  is_completed: boolean;
  created_by: string;
  created_at: string;
  household_id: string | null;
};

const Shopping = () => {
  const { currentHousehold } = useHousehold();
  const { currentUser } = useAuth();
  const { translate } = useLanguage();
  const queryClient = useQueryClient();
  
  const [newStore, setNewStore] = useState('');
  const [newList, setNewList] = useState<Partial<ShoppingList>>({
    name: '',
  });
  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({
    name: '',
    store_id: null,
    is_private: false,
  });
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [storeItems, setStoreItems] = useState<Record<string, ShoppingItem[]>>({});

  // Fetch stores
  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      return data as Store[];
    },
    enabled: !!currentUser,
  });

  // Fetch shopping lists
  const { data: shoppingLists = [], isLoading: isLoadingLists } = useQuery({
    queryKey: ['shopping_lists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as ShoppingList[];
    },
    enabled: !!currentUser,
  });

  // Create a new store mutation
  const createStoreMutation = useMutation({
    mutationFn: async (newStore: { name: string, household_id: string | null }) => {
      const { data, error } = await supabase
        .from('stores')
        .insert([{
          ...newStore,
          created_by: currentUser?.id
        }])
        .select('*');
      
      if (error) {
        throw error;
      }
      
      return data[0] as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      toast.success('Store added successfully');
      setNewStore('');
    },
    onError: (error) => {
      toast.error(`Error adding store: ${error.message}`);
    }
  });

  // Create a new shopping list mutation
  const createShoppingListMutation = useMutation({
    mutationFn: async (newList: Partial<ShoppingList>) => {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([{
          name: newList.name,
          household_id: currentHousehold?.id || null,
          created_by: currentUser?.id,
          is_completed: false
        }])
        .select('*');
      
      if (error) {
        throw error;
      }
      
      return data[0] as ShoppingList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] });
      toast.success('Shopping list created');
      setNewList({ name: '' });
    },
    onError: (error) => {
      toast.error(`Error creating list: ${error.message}`);
    }
  });

  // Add item to a shopping list mutation
  const addItemMutation = useMutation({
    mutationFn: async (newItemData: { 
      name: string, 
      store_id: string | null, 
      is_private: boolean, 
      shopping_list_id: string 
    }) => {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .insert([{
          ...newItemData,
          created_by: currentUser?.id,
          is_collected: false
        }])
        .select('*');
      
      if (error) {
        throw error;
      }
      
      return data[0] as ShoppingItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_list_items'] });
      toast.success('Item added');
      setNewItem({ name: '', store_id: newItem.store_id, is_private: false });
    },
    onError: (error) => {
      toast.error(`Error adding item: ${error.message}`);
    }
  });

  // Delete shopping list mutation
  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);
      
      if (error) {
        throw error;
      }
      
      return listId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] });
      toast.success('Shopping list deleted');
    },
    onError: (error) => {
      toast.error(`Error deleting list: ${error.message}`);
    }
  });

  // Mark list as complete mutation
  const markListAsCompleteMutation = useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ is_completed: true })
        .eq('id', listId);
      
      if (error) {
        throw error;
      }
      
      return listId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping_lists'] });
      toast.success('Shopping list marked as complete');
    },
    onError: (error) => {
      toast.error(`Error updating list: ${error.message}`);
    }
  });

  // Toggle item collection status mutation
  const toggleItemCollectionMutation = useMutation({
    mutationFn: async ({ itemId, isCollected }: { itemId: string, isCollected: boolean }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_collected: isCollected })
        .eq('id', itemId);
      
      if (error) {
        throw error;
      }
      
      return { itemId, isCollected };
    },
    onSuccess: (_, { itemId }) => {
      // We'll update the local state optimistically
      setStoreItems(prev => {
        const updated = { ...prev };
        for (const storeId in updated) {
          updated[storeId] = updated[storeId].map(item => 
            item.id === itemId ? { ...item, is_collected: !item.is_collected } : item
          );
        }
        return updated;
      });
    },
    onError: (error) => {
      toast.error(`Error updating item: ${error.message}`);
      // Refetch to revert local state if there was an error
      if (editingList) {
        fetchItemsForList(editingList.id);
      }
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);
      
      if (error) {
        throw error;
      }
      
      return itemId;
    },
    onSuccess: (_, itemId) => {
      // We'll update the local state optimistically
      setStoreItems(prev => {
        const updated = { ...prev };
        for (const storeId in updated) {
          updated[storeId] = updated[storeId].filter(item => item.id !== itemId);
        }
        return updated;
      });
      toast.success('Item removed');
    },
    onError: (error) => {
      toast.error(`Error deleting item: ${error.message}`);
      // Refetch to revert local state if there was an error
      if (editingList) {
        fetchItemsForList(editingList.id);
      }
    }
  });

  // Function to fetch items for a specific list
  const fetchItemsForList = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('shopping_list_id', listId);
      
      if (error) {
        throw error;
      }
      
      // Group items by store
      const groupedItems: Record<string, ShoppingItem[]> = {};
      
      // Initialize with "no-store" group
      groupedItems['no-store'] = [];
      
      data.forEach(item => {
        // Skip private items that don't belong to current user
        if (item.is_private && item.created_by !== currentUser?.id) {
          return;
        }
        
        const storeId = item.store_id || 'no-store';
        if (!groupedItems[storeId]) {
          groupedItems[storeId] = [];
        }
        
        groupedItems[storeId].push(item as ShoppingItem);
      });
      
      setStoreItems(groupedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Error fetching shopping items');
    }
  };

  // When a list is selected for editing, fetch its items
  useEffect(() => {
    if (editingList) {
      fetchItemsForList(editingList.id);
    } else {
      setStoreItems({});
    }
  }, [editingList]);

  // Handle creating a new store
  const handleCreateStore = () => {
    if (!newStore.trim()) {
      toast.error('Please enter a store name');
      return;
    }
    
    createStoreMutation.mutate({ 
      name: newStore.trim(), 
      household_id: currentHousehold?.id || null 
    });
  };

  // Handle creating a new shopping list
  const handleCreateList = () => {
    if (!newList.name?.trim()) {
      toast.error('Please enter a list name');
      return;
    }
    
    if (!currentUser) return;
    
    createShoppingListMutation.mutate(newList);
  };

  // Handle adding an item to a shopping list
  const handleAddItem = () => {
    if (!editingList || !newItem.name?.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    
    if (!currentUser) return;
    
    addItemMutation.mutate({ 
      name: newItem.name.trim(),
      store_id: newItem.store_id || null,
      is_private: !!newItem.is_private,
      shopping_list_id: editingList.id
    });
  };

  // Toggle item collection status
  const toggleItemCollected = (itemId: string, currentStatus: boolean) => {
    toggleItemCollectionMutation.mutate({ 
      itemId, 
      isCollected: !currentStatus 
    });
  };

  // Delete an item
  const deleteItem = (itemId: string) => {
    deleteItemMutation.mutate(itemId);
  };

  // Mark shopping list as complete
  const markListAsComplete = (listId: string) => {
    markListAsCompleteMutation.mutate(listId);
  };

  // Delete shopping list
  const deleteList = (listId: string) => {
    deleteListMutation.mutate(listId);
  };

  // Get store name by ID
  const getStoreNameById = (id: string | null) => {
    if (!id) return null;
    const store = stores.find(s => s.id === id);
    return store ? store.name : null;
  };

  // Filter shopping lists based on tab
  const filteredLists = shoppingLists.filter(list => {
    return activeTab === 'completed' ? list.is_completed : !list.is_completed;
  });

  // Loading state
  if (isLoadingStores || isLoadingLists) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foodish-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{translate('shopping')}</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-foodish-500 hover:bg-foodish-600">
              <Plus className="h-4 w-4 mr-2" />
              {translate('createNew')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shopping List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{translate('name')}</label>
                <Input
                  placeholder="Shopping list name"
                  value={newList.name || ''}
                  onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleCreateList} 
                className="bg-foodish-500 hover:bg-foodish-600"
              >
                {translate('createNew')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Store management */}
      <Card className="mb-6 border-foodish-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Store className="h-5 w-5 mr-2" /> 
            {translate('Custom Stores')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {stores.map(store => (
              <div 
                key={store.id}
                className="px-3 py-1 bg-foodish-50 rounded-full text-foodish-700 text-sm"
              >
                {store.name}
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="New store name"
              value={newStore}
              onChange={(e) => setNewStore(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleCreateStore} 
              className="bg-foodish-500 hover:bg-foodish-600"
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Shopping Lists */}
      <div className="space-y-4">
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'active' ? 'default' : 'outline'}
            className={activeTab === 'active' ? 'bg-foodish-500 hover:bg-foodish-600' : ''}
            onClick={() => setActiveTab('active')}
          >
            Active
          </Button>
          <Button
            variant={activeTab === 'completed' ? 'default' : 'outline'}
            className={activeTab === 'completed' ? 'bg-foodish-500 hover:bg-foodish-600' : ''}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </Button>
        </div>
        
        {filteredLists.length > 0 ? (
          filteredLists.map(list => {
            // Fetch list items for preview
            const { data: previewItems } = useQuery({
              queryKey: ['shopping_list_items', list.id, 'preview'],
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('shopping_list_items')
                  .select('*')
                  .eq('shopping_list_id', list.id)
                  .limit(6);
                
                if (error) {
                  throw error;
                }
                
                return data as ShoppingItem[];
              }
            });
            
            // Filter items that the current user can see
            const visibleItems = previewItems?.filter(
              item => !item.is_private || item.created_by === currentUser?.id
            ) || [];
            
            return (
              <Card key={list.id} className="border-foodish-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingList(list)}
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>{list.name}</DialogTitle>
                        </DialogHeader>
                        
                        {editingList && editingList.id === list.id && (
                          <div className="py-4">
                            {/* Add new item form */}
                            <div className="flex items-end space-x-2 mb-6">
                              <div className="flex-1 space-y-2">
                                <label className="text-sm font-medium">Add Item</label>
                                <Input
                                  placeholder="Item name"
                                  value={newItem.name || ''}
                                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Store</label>
                                <Select
                                  value={newItem.store_id || ''}
                                  onValueChange={(value) => 
                                    setNewItem({ ...newItem, store_id: value || null })
                                  }
                                >
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {stores.map(store => (
                                      <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                onClick={handleAddItem} 
                                className="bg-foodish-500 hover:bg-foodish-600"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-4">
                              <Checkbox
                                id="private-item"
                                checked={newItem.is_private}
                                onCheckedChange={(checked) => 
                                  setNewItem({ ...newItem, is_private: checked as boolean })
                                }
                              />
                              <label
                                htmlFor="private-item"
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Private item (only visible to you)
                              </label>
                            </div>
                            
                            {/* Items grouped by store */}
                            {Object.entries(storeItems).map(([storeId, items]) => {
                              // Skip empty groups
                              if (items.length === 0) return null;
                              
                              const storeName = storeId === 'no-store' 
                                ? 'No store assigned' 
                                : getStoreNameById(storeId) || 'Unknown store';
                              
                              return (
                                <div key={storeId} className="mb-4">
                                  <h3 className="font-medium text-sm text-gray-500 mb-2">
                                    {storeName}
                                  </h3>
                                  <div className="space-y-2">
                                    {items.map(item => (
                                      <div 
                                        key={item.id} 
                                        className={`flex items-center justify-between p-2 rounded-md ${
                                          item.is_collected ? 'bg-gray-50' : 'bg-white'
                                        } border border-gray-100`}
                                      >
                                        <div className="flex items-center">
                                          <Checkbox
                                            checked={item.is_collected}
                                            onCheckedChange={() => toggleItemCollected(item.id, item.is_collected)}
                                            className="mr-3"
                                          />
                                          <span className={item.is_collected ? 'line-through text-gray-500' : ''}>
                                            {item.name}
                                            {item.is_private && (
                                              <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                                Private
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <button
                                            onClick={() => deleteItem(item.id)}
                                            className="text-gray-400 hover:text-red-500"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* List actions */}
                            <div className="flex justify-between mt-6">
                              <Button 
                                variant="outline" 
                                onClick={() => deleteList(list.id)}
                                className="text-red-600 hover:text-red-700 border-red-100 hover:border-red-200 bg-red-50 hover:bg-red-100"
                              >
                                Delete List
                              </Button>
                              <Button 
                                onClick={() => markListAsComplete(list.id)}
                                className="bg-foodish-500 hover:bg-foodish-600"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">
                      {visibleItems.length} items
                    </div>
                    
                    {/* Preview of items */}
                    <div className="flex flex-wrap gap-2">
                      {visibleItems.slice(0, 5).map(item => (
                        <div 
                          key={item.id}
                          className={`px-3 py-1 rounded-full text-sm ${
                            item.is_collected
                              ? 'bg-gray-100 text-gray-500 line-through'
                              : 'bg-foodish-50 text-foodish-700'
                          }`}
                        >
                          {item.name}
                        </div>
                      ))}
                      {visibleItems.length > 5 && (
                        <div className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-sm">
                          +{visibleItems.length - 5} more
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <div>
                        Created by {list.created_by === currentUser?.id ? 'You' : 'Household member'}
                      </div>
                      <div>
                        {new Date(list.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>No {activeTab === 'completed' ? 'completed' : 'active'} shopping lists</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Shopping List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Shopping List</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{translate('name')}</label>
                    <Input
                      placeholder="Shopping list name"
                      value={newList.name || ''}
                      onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={handleCreateList} 
                    className="bg-foodish-500 hover:bg-foodish-600"
                  >
                    {translate('createNew')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shopping;
