
import React from 'react';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const Chores = () => {
  const { currentUser } = useAuth();
  const { currentHousehold } = useHousehold();
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Household Chores</h1>
      
      {!currentHousehold ? (
        <Card>
          <CardHeader>
            <CardTitle>No Household Selected</CardTitle>
            <CardDescription>
              Please select or create a household to manage chores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You need to be part of a household to manage chores.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{currentHousehold.name} Chores</CardTitle>
              <CardDescription>
                Manage household tasks for your family
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No chores have been created yet. Add your first chore to get started.
              </p>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Household members: {currentHousehold.members.length}
              </p>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Chores;
