
import React, { useState, useEffect } from 'react';
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

// Shopping list types
type Store = {
  id: string;
  name: string;
};

type ShoppingItem = {
  id: string;
  name: string;
  storeId: string | null;
  isCollected: boolean;
  addedBy: string;
  isPrivate: boolean;
  price?: number;
};

type ShoppingList = {
  id: string;
  name: string;
  items: ShoppingItem[];
  createdBy: string;
  createdAt: string;
  isCompleted: boolean;
};

const Shopping = () => {
  const { currentHousehold } = useHousehold();
  const { currentUser } = useAuth();
  const { translate } = useLanguage();
  
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [newStore, setNewStore] = useState('');
  const [newList, setNewList] = useState<Partial<ShoppingList>>({
    name: '',
    items: [],
  });
  const [newItem, setNewItem] = useState<Partial<ShoppingItem>>({
    name: '',
    storeId: null,
    isPrivate: false,
  });
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  // Load sample stores
  useEffect(() => {
    // In a real app, this would fetch from a database
    const sampleStores: Store[] = [
      {
        id: '1',
        name: 'Grocery Store',
      },
      {
        id: '2',
        name: 'Hardware Store',
      },
      {
        id: '3',
        name: 'Pharmacy',
      },
    ];
    
    setStores(sampleStores);
  }, []);

  // Load sample shopping lists
  useEffect(() => {
    if (!currentUser) return;
    
    // In a real app, this would fetch from a database
    const sampleLists: ShoppingList[] = [
      {
        id: '1',
        name: 'Weekly groceries',
        items: [
          {
            id: '1',
            name: 'Milk',
            storeId: '1',
            isCollected: false,
            addedBy: currentUser.id,
            isPrivate: false,
            price: 2.99,
          },
          {
            id: '2',
            name: 'Bread',
            storeId: '1',
            isCollected: true,
            addedBy: currentUser.id,
            isPrivate: false,
            price: 3.49,
          },
          {
            id: '3',
            name: 'Private item',
            storeId: null,
            isCollected: false,
            addedBy: currentUser.id,
            isPrivate: true,
          },
        ],
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        isCompleted: false,
      },
    ];
    
    setShoppingLists(sampleLists);
  }, [currentUser]);

  // Create a new store
  const handleCreateStore = () => {
    if (!newStore.trim()) {
      toast.error('Please enter a store name');
      return;
    }
    
    const store: Store = {
      id: Math.random().toString(36).substring(2, 9),
      name: newStore.trim(),
    };
    
    setStores([...stores, store]);
    setNewStore('');
    toast.success('Store added successfully');
  };

  // Create a new shopping list
  const handleCreateList = () => {
    if (!newList.name?.trim()) {
      toast.error('Please enter a list name');
      return;
    }
    
    if (!currentUser) return;
    
    const list: ShoppingList = {
      id: Math.random().toString(36).substring(2, 9),
      name: newList.name.trim(),
      items: [],
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };
    
    setShoppingLists([...shoppingLists, list]);
    setNewList({ name: '', items: [] });
    toast.success('Shopping list created');
  };

  // Add item to a shopping list
  const handleAddItem = () => {
    if (!editingList || !newItem.name?.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    
    if (!currentUser) return;
    
    const item: ShoppingItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: newItem.name.trim(),
      storeId: newItem.storeId || null,
      isCollected: false,
      addedBy: currentUser.id,
      isPrivate: !!newItem.isPrivate,
    };
    
    const updatedLists = shoppingLists.map(list => 
      list.id === editingList.id 
        ? { ...list, items: [...list.items, item] }
        : list
    );
    
    setShoppingLists(updatedLists);
    setEditingList({ ...editingList, items: [...editingList.items, item] });
    setNewItem({ name: '', storeId: newItem.storeId, isPrivate: false });
    toast.success('Item added');
  };

  // Toggle item collection status
  const toggleItemCollected = (listId: string, itemId: string) => {
    const updatedLists = shoppingLists.map(list => {
      if (list.id === listId) {
        const updatedItems = list.items.map(item => 
          item.id === itemId ? { ...item, isCollected: !item.isCollected } : item
        );
        return { ...list, items: updatedItems };
      }
      return list;
    });
    
    setShoppingLists(updatedLists);
    
    if (editingList && editingList.id === listId) {
      const updatedItems = editingList.items.map(item => 
        item.id === itemId ? { ...item, isCollected: !item.isCollected } : item
      );
      setEditingList({ ...editingList, items: updatedItems });
    }
  };

  // Delete an item
  const deleteItem = (listId: string, itemId: string) => {
    const updatedLists = shoppingLists.map(list => {
      if (list.id === listId) {
        return { 
          ...list, 
          items: list.items.filter(item => item.id !== itemId) 
        };
      }
      return list;
    });
    
    setShoppingLists(updatedLists);
    
    if (editingList && editingList.id === listId) {
      setEditingList({
        ...editingList,
        items: editingList.items.filter(item => item.id !== itemId)
      });
    }
    
    toast.success('Item removed');
  };

  // Mark shopping list as complete
  const markListAsComplete = (listId: string) => {
    const updatedLists = shoppingLists.map(list => 
      list.id === listId ? { ...list, isCompleted: true } : list
    );
    
    setShoppingLists(updatedLists);
    toast.success('Shopping list completed');
  };

  // Delete shopping list
  const deleteList = (listId: string) => {
    setShoppingLists(shoppingLists.filter(list => list.id !== listId));
    toast.success('Shopping list deleted');
  };

  // Get user name by ID
  const getUserNameById = (id: string) => {
    const member = currentHousehold?.members.find(m => m.id === id);
    return member?.displayName || member?.email.split('@')[0] || 'Unknown';
  };

  // Get store name by ID
  const getStoreNameById = (id: string | null) => {
    if (!id) return null;
    return stores.find(s => s.id === id)?.name || null;
  };

  // Filter shopping lists based on tab
  const filteredLists = shoppingLists.filter(list => {
    return activeTab === 'completed' ? list.isCompleted : !list.isCompleted;
  });

  // Group items by store
  const groupItemsByStore = (items: ShoppingItem[]) => {
    const groupedItems: Record<string, ShoppingItem[]> = {};
    
    // Group for items with no store
    groupedItems['no-store'] = [];
    
    // Create groups for each store
    stores.forEach(store => {
      groupedItems[store.id] = [];
    });
    
    // Fill groups with items
    items.forEach(item => {
      // Skip private items that don't belong to current user
      if (item.isPrivate && item.addedBy !== currentUser?.id) {
        return;
      }
      
      if (item.storeId && groupedItems[item.storeId]) {
        groupedItems[item.storeId].push(item);
      } else {
        groupedItems['no-store'].push(item);
      }
    });
    
    return groupedItems;
  };

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
              <Button onClick={handleCreateList} className="bg-foodish-500 hover:bg-foodish-600">
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
            <Button onClick={handleCreateStore} className="bg-foodish-500 hover:bg-foodish-600">
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
          filteredLists.map(list => (
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
                      
                      {editingList && (
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
                                value={newItem.storeId || ''}
                                onValueChange={(value) => 
                                  setNewItem({ ...newItem, storeId: value || null })
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
                            <Button onClick={handleAddItem} className="bg-foodish-500 hover:bg-foodish-600">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-4">
                            <Checkbox
                              id="private-item"
                              checked={newItem.isPrivate}
                              onCheckedChange={(checked) => 
                                setNewItem({ ...newItem, isPrivate: checked as boolean })
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
                          {Object.entries(groupItemsByStore(editingList.items)).map(([storeId, items]) => {
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
                                        item.isCollected ? 'bg-gray-50' : 'bg-white'
                                      } border border-gray-100`}
                                    >
                                      <div className="flex items-center">
                                        <Checkbox
                                          checked={item.isCollected}
                                          onCheckedChange={() => toggleItemCollected(list.id, item.id)}
                                          className="mr-3"
                                        />
                                        <span className={item.isCollected ? 'line-through text-gray-500' : ''}>
                                          {item.name}
                                          {item.isPrivate && (
                                            <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                              Private
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <button
                                          onClick={() => deleteItem(list.id, item.id)}
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
                    {list.items.length} items
                  </div>
                  
                  {/* Preview of items */}
                  <div className="flex flex-wrap gap-2">
                    {list.items
                      .filter(item => !item.isPrivate || item.addedBy === currentUser?.id)
                      .slice(0, 5)
                      .map(item => (
                        <div 
                          key={item.id}
                          className={`px-3 py-1 rounded-full text-sm ${
                            item.isCollected
                              ? 'bg-gray-100 text-gray-500 line-through'
                              : 'bg-foodish-50 text-foodish-700'
                          }`}
                        >
                          {item.name}
                        </div>
                      ))}
                    {list.items.length > 5 && (
                      <div className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-sm">
                        +{list.items.length - 5} more
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div>
                      Created by {getUserNameById(list.createdBy)}
                    </div>
                    <div>
                      {new Date(list.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
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
              <DialogContent>{/* Same content as above */}</DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shopping;
