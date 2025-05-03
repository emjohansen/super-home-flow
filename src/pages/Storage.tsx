
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  CalendarIcon,
  Edit,
  Trash,
  RefrigeratorIcon,
  PackageIcon
} from 'lucide-react';

interface StorageLocation {
  id: string;
  name: string;
  type: string;
  description: string | null;
  household_id: string;
  created_by: string;
  created_at: string;
}

interface StorageItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  expiry_date: string | null;
  notes: string | null;
  storage_location_id: string;
  created_by: string;
  created_at: string;
}

const Storage = () => {
  const { currentUser } = useAuth();
  const { currentHousehold } = useHousehold();
  const queryClient = useQueryClient();
  
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [newLocation, setNewLocation] = useState<Partial<StorageLocation>>({
    name: '',
    type: 'pantry',
    description: ''
  });
  
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  
  const [newItem, setNewItem] = useState<Partial<StorageItem>>({
    name: '',
    quantity: 1,
    unit: '',
    notes: '',
    expiry_date: null
  });
  
  const [editingItem, setEditingItem] = useState<StorageItem | null>(null);
  
  const locationTypes = [
    { value: 'pantry', label: 'Pantry' },
    { value: 'fridge', label: 'Refrigerator' },
    { value: 'freezer', label: 'Freezer' },
    { value: 'cabinet', label: 'Cabinet' },
    { value: 'drawer', label: 'Drawer' },
    { value: 'shelf', label: 'Shelf' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch storage locations
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ['storage_locations'],
    queryFn: async () => {
      if (!currentUser || !currentHousehold) return [];
      
      const { data, error } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .order('name');
      
      if (error) {
        toast.error(`Error fetching storage locations: ${error.message}`);
        throw error;
      }
      
      return data as StorageLocation[];
    },
    enabled: !!currentUser && !!currentHousehold
  });

  // Fetch storage items for selected location
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['storage_items', selectedLocation],
    queryFn: async () => {
      if (!currentUser || !selectedLocation) return [];
      
      const { data, error } = await supabase
        .from('storage_items')
        .select('*')
        .eq('storage_location_id', selectedLocation)
        .order('name');
      
      if (error) {
        toast.error(`Error fetching storage items: ${error.message}`);
        throw error;
      }
      
      return data as StorageItem[];
    },
    enabled: !!currentUser && !!selectedLocation
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (location: Partial<StorageLocation>) => {
      if (!currentUser || !currentHousehold) 
        throw new Error('User not authenticated or no household selected');
      
      const { data, error } = await supabase
        .from('storage_locations')
        .insert([{
          name: location.name,
          type: location.type,
          description: location.description,
          household_id: currentHousehold.id,
          created_by: currentUser.id
        }])
        .select('*');
      
      if (error) throw error;
      
      return data[0] as StorageLocation;
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ['storage_locations'] });
      toast.success('Storage location created');
      setSelectedLocation(newLocation.id);
      resetLocationForm();
      setIsAddingLocation(false);
    },
    onError: (error: any) => {
      toast.error(`Error creating location: ${error.message}`);
    }
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async (location: StorageLocation) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('storage_locations')
        .update({
          name: location.name,
          type: location.type,
          description: location.description
        })
        .eq('id', location.id)
        .select('*');
      
      if (error) throw error;
      
      return data[0] as StorageLocation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage_locations'] });
      toast.success('Storage location updated');
      setEditingLocation(null);
      setIsEditingLocation(false);
    },
    onError: (error: any) => {
      toast.error(`Error updating location: ${error.message}`);
    }
  });

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: string) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('storage_locations')
        .delete()
        .eq('id', locationId);
      
      if (error) throw error;
      
      return locationId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['storage_locations'] });
      toast.success('Storage location deleted');
      
      if (selectedLocation === deletedId) {
        setSelectedLocation(null);
      }
    },
    onError: (error: any) => {
      toast.error(`Error deleting location: ${error.message}`);
    }
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (item: Partial<StorageItem>) => {
      if (!currentUser || !selectedLocation) 
        throw new Error('User not authenticated or no location selected');
      
      const { data, error } = await supabase
        .from('storage_items')
        .insert([{
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          expiry_date: item.expiry_date,
          storage_location_id: selectedLocation,
          created_by: currentUser.id
        }])
        .select('*');
      
      if (error) throw error;
      
      return data[0] as StorageItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage_items', selectedLocation] });
      toast.success('Item added');
      resetItemForm();
      setIsAddingItem(false);
    },
    onError: (error: any) => {
      toast.error(`Error adding item: ${error.message}`);
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (item: StorageItem) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('storage_items')
        .update({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          expiry_date: item.expiry_date
        })
        .eq('id', item.id)
        .select('*');
      
      if (error) throw error;
      
      return data[0] as StorageItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage_items', selectedLocation] });
      toast.success('Item updated');
      setEditingItem(null);
      setIsEditingItem(false);
    },
    onError: (error: any) => {
      toast.error(`Error updating item: ${error.message}`);
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!currentUser) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('storage_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage_items', selectedLocation] });
      toast.success('Item deleted');
    },
    onError: (error: any) => {
      toast.error(`Error deleting item: ${error.message}`);
    }
  });

  const resetLocationForm = () => {
    setNewLocation({
      name: '',
      type: 'pantry',
      description: ''
    });
  };

  const resetItemForm = () => {
    setNewItem({
      name: '',
      quantity: 1,
      unit: '',
      notes: '',
      expiry_date: null
    });
  };

  const handleCreateLocation = () => {
    if (!newLocation.name) {
      toast.error('Please enter a location name');
      return;
    }
    
    createLocationMutation.mutate(newLocation);
  };

  const handleUpdateLocation = () => {
    if (!editingLocation || !editingLocation.name) {
      toast.error('Please enter a location name');
      return;
    }
    
    updateLocationMutation.mutate(editingLocation);
  };

  const handleDeleteLocation = (locationId: string) => {
    if (confirm('Are you sure you want to delete this location? All items in this location will also be deleted.')) {
      deleteLocationMutation.mutate(locationId);
    }
  };

  const handleCreateItem = () => {
    if (!newItem.name) {
      toast.error('Please enter an item name');
      return;
    }
    
    createItemMutation.mutate(newItem);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !editingItem.name) {
      toast.error('Please enter an item name');
      return;
    }
    
    updateItemMutation.mutate(editingItem);
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'fridge':
      case 'freezer':
        return <RefrigeratorIcon className="h-5 w-5 text-foodish-600" />;
      default:
        return <PackageIcon className="h-5 w-5 text-foodish-600" />;
    }
  };

  // Format a date string for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return '';
      return format(date, 'PP');
    } catch (e) {
      return '';
    }
  };

  if (!currentHousehold) {
    return (
      <div className="p-4 text-center">
        <p>Please create or select a household first.</p>
      </div>
    );
  }

  if (isLoadingLocations) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foodish-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Storage</h1>
        <Button 
          onClick={() => setIsAddingLocation(true)}
          className="bg-foodish-500 hover:bg-foodish-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Storage Locations */}
      {locations.length === 0 ? (
        <div className="text-center py-16">
          <div className="rounded-full bg-foodish-50 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <RefrigeratorIcon className="h-6 w-6 text-foodish-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No storage locations yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new storage location.
          </p>
          <Button 
            onClick={() => setIsAddingLocation(true)}
            variant="outline"
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Storage Location
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {locations.map(location => (
              <Button
                key={location.id}
                variant={selectedLocation === location.id ? "default" : "outline"}
                className={`flex items-center ${selectedLocation === location.id ? 'bg-foodish-500 hover:bg-foodish-600' : ''}`}
                onClick={() => setSelectedLocation(location.id)}
              >
                {getLocationIcon(location.type)}
                <span className="ml-2">{location.name}</span>
              </Button>
            ))}
          </div>

          {selectedLocation && (
            <Card className="border-foodish-100">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    {getLocationIcon(locations.find(l => l.id === selectedLocation)?.type || '')}
                    <span className="ml-2">
                      {locations.find(l => l.id === selectedLocation)?.name}
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {locations.find(l => l.id === selectedLocation)?.description}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const location = locations.find(l => l.id === selectedLocation);
                      if (location) {
                        setEditingLocation(location);
                        setIsEditingLocation(true);
                      }
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteLocation(selectedLocation)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Items</h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetItemForm();
                      setIsAddingItem(true);
                    }}
                    className="bg-foodish-500 hover:bg-foodish-600"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {isLoadingItems ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foodish-500"></div>
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PackageIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p>No items in this location</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setIsAddingItem(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            {item.quantity && (
                              <span>
                                {item.quantity} {item.unit || ''}
                              </span>
                            )}
                            {item.expiry_date && (
                              <span>
                                Expires: {formatDate(item.expiry_date)}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditingItem(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Location Dialog */}
      <Dialog open={isAddingLocation} onOpenChange={setIsAddingLocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Storage Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Kitchen Pantry"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={newLocation.type}
                onValueChange={(value) => setNewLocation({ ...newLocation, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea
                placeholder="Enter a description"
                value={newLocation.description || ''}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetLocationForm();
                setIsAddingLocation(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLocation}
              className="bg-foodish-500 hover:bg-foodish-600"
            >
              Add Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={isEditingLocation && !!editingLocation} onOpenChange={setIsEditingLocation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Storage Location</DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g. Kitchen Pantry"
                  value={editingLocation.name}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={editingLocation.type}
                  onValueChange={(value) => setEditingLocation({ ...editingLocation, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  placeholder="Enter a description"
                  value={editingLocation.description || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingLocation(null);
                setIsEditingLocation(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateLocation}
              className="bg-foodish-500 hover:bg-foodish-600"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Milk"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  placeholder="1"
                  value={newItem.quantity?.toString() || ''}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || null })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit (optional)</label>
                <Input
                  placeholder="e.g. liters"
                  value={newItem.unit || ''}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry Date (optional)</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newItem.expiry_date ? format(new Date(newItem.expiry_date), 'PPP') : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newItem.expiry_date ? new Date(newItem.expiry_date) : undefined}
                    onSelect={(date) => {
                      setNewItem({ 
                        ...newItem, 
                        expiry_date: date ? date.toISOString() : null 
                      });
                      setCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Any additional information"
                value={newItem.notes || ''}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetItemForm();
                setIsAddingItem(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateItem}
              className="bg-foodish-500 hover:bg-foodish-600"
            >
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditingItem && !!editingItem} onOpenChange={setIsEditingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g. Milk"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={editingItem.quantity?.toString() || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || null })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit (optional)</label>
                  <Input
                    placeholder="e.g. liters"
                    value={editingItem.unit || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date (optional)</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingItem.expiry_date ? format(new Date(editingItem.expiry_date), 'PPP') : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editingItem.expiry_date ? new Date(editingItem.expiry_date) : undefined}
                      onSelect={(date) => {
                        setEditingItem({ 
                          ...editingItem, 
                          expiry_date: date ? date.toISOString() : null 
                        });
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Any additional information"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingItem(null);
                setIsEditingItem(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateItem}
              className="bg-foodish-500 hover:bg-foodish-600"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Storage;
