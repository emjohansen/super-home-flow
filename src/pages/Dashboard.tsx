
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, BookOpen, CheckSquare, ShoppingBag, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Avatar from '@/components/Avatar';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { currentHousehold } = useHousehold();
  const { translate } = useLanguage();
  const navigate = useNavigate();
  
  // Get display name and avatar color from user_metadata or fallback to email/default color
  const displayName = currentUser?.user_metadata?.display_name || currentUser?.email?.split('@')[0] || 'User';
  const avatarColor = currentUser?.user_metadata?.avatar_color || '#4A9F41';
  
  const features = [
    {
      name: translate('recipes'),
      icon: BookOpen,
      description: 'Browse and create recipes',
      path: '/recipes',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      name: translate('chores'),
      icon: CheckSquare,
      description: 'Manage household chores',
      path: '/chores',
      color: 'bg-amber-100 text-amber-700',
    },
    {
      name: translate('shopping'),
      icon: ShoppingBag,
      description: 'Create shopping lists',
      path: '/shopping',
      color: 'bg-green-100 text-green-700',
    },
    {
      name: translate('settings'),
      icon: Settings,
      description: 'Update your preferences',
      path: '/settings',
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="p-4 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{translate('dashboard')}</h1>
          <p className="text-gray-500">
            {currentHousehold ? currentHousehold.name : 'No household selected'}
          </p>
        </div>
        <Avatar 
          name={displayName} 
          color={avatarColor}
        />
      </div>

      {/* Household Members */}
      {currentHousehold && (
        <Card className="mb-6 border-foodish-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{translate('members')}</CardTitle>
            <CardDescription>
              {currentHousehold.members.length} {translate('members')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentHousehold.members.map((member) => (
                <div key={member.id} className="flex flex-col items-center">
                  <Avatar
                    name={member.displayName || member.email}
                    color={member.avatar_color}
                    size="sm"
                  />
                  <span className="text-xs mt-1 truncate max-w-[50px]">
                    {member.displayName || member.email?.split('@')[0]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature) => (
          <Button
            key={feature.name}
            variant="outline"
            className="h-32 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-100"
            onClick={() => navigate(feature.path)}
          >
            <div className={`w-10 h-10 rounded-full ${feature.color} flex items-center justify-center`}>
              <feature.icon className="h-5 w-5" />
            </div>
            <span className="font-medium">{feature.name}</span>
          </Button>
        ))}
      </div>

      {/* Recent Activities (placeholder) */}
      <Card className="mt-6 border-foodish-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p>Shopping list "Groceries" updated</p>
              <span className="text-xs">Today</span>
            </div>
            <div className="flex justify-between items-center">
              <p>New recipe "Pasta Carbonara" added</p>
              <span className="text-xs">Yesterday</span>
            </div>
            <div className="flex justify-between items-center">
              <p>Laundry chore completed</p>
              <span className="text-xs">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
