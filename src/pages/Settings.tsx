
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Avatar from '@/components/Avatar';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const { households, currentHousehold, switchHousehold, createHousehold, inviteMember } = useHousehold();
  const { translate, language, setLanguage, availableLanguages } = useLanguage();
  const navigate = useNavigate();
  
  // Get display name from user_metadata or fallback
  const userDisplayName = currentUser?.user_metadata?.display_name || '';
  // Get avatar color from user_metadata or fallback
  const userAvatarColor = currentUser?.user_metadata?.avatar_color || '#4A9F41';
  
  // States
  const [nickname, setNickname] = useState(userDisplayName);
  const [avatarColor, setAvatarColor] = useState(userAvatarColor);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [creatingHousehold, setCreatingHousehold] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  
  // Handle saving profile
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      await updateProfile({
        displayName: nickname,
        avatarColor
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle creating household
  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) {
      toast.error('Please enter a household name');
      return;
    }
    
    setCreatingHousehold(true);
    try {
      await createHousehold(newHouseholdName.trim());
      toast.success('Household created successfully');
      setNewHouseholdName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create household');
    } finally {
      setCreatingHousehold(false);
    }
  };
  
  // Handle inviting a member
  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !currentHousehold) {
      toast.error('Please enter an email address');
      return;
    }
    
    setInviteError('');
    setSending(true);
    
    try {
      const result = await inviteMember(inviteEmail.trim(), currentHousehold.id);
      if (result) {
        toast.success('Member added successfully');
        setInviteEmail('');
      } else {
        setInviteError('Could not add member. User may not exist or is already a member.');
      }
    } catch (error: any) {
      setInviteError(error.message || 'Failed to add member');
      toast.error(error.message || 'Failed to add member');
    } finally {
      setSending(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
      console.error(error);
    }
  };
  
  // Get display name for the header
  const displayName = currentUser?.user_metadata?.display_name || 
                      currentUser?.email?.split('@')[0] || 'User';
                      
  return (
    <div className="p-4 pb-20 animate-fade-in">
      <h1 className="text-2xl font-bold mb-4">{translate('settings')}</h1>
      
      {/* Profile Settings */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">{translate('profile')}</h2>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center mb-4">
            <Avatar 
              name={displayName} 
              color={avatarColor}
              size="lg"
            />
            <div className="ml-3">
              <h3 className="font-medium">
                {displayName}
              </h3>
              <p className="text-sm text-gray-500">{currentUser?.email}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium mb-1">
                {translate('nickname')}
              </label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Your nickname"
              />
            </div>
            
            <div>
              <label htmlFor="avatarColor" className="block text-sm font-medium mb-1">
                {translate('avatarColor')}
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  id="avatarColor"
                  type="color"
                  value={avatarColor}
                  onChange={(e) => setAvatarColor(e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <div 
                  className="w-8 h-8 rounded-full border border-gray-200" 
                  style={{ backgroundColor: avatarColor }}
                ></div>
              </div>
            </div>
            
            <Button onClick={handleSaveProfile} disabled={saving} className="bg-foodish-500 hover:bg-foodish-600">
              {saving ? 'Saving...' : translate('save')}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Household Settings */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">{translate('households')}</h2>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="mb-4">
            <label htmlFor="currentHousehold" className="block text-sm font-medium mb-1">
              {translate('currentHousehold')}
            </label>
            <Select 
              value={currentHousehold?.id} 
              onValueChange={(value) => switchHousehold(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a household" />
              </SelectTrigger>
              <SelectContent>
                {households.map(household => (
                  <SelectItem key={household.id} value={household.id}>
                    {household.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mb-4">
                {translate('createHousehold')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{translate('createHousehold')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{translate('name')}</label>
                  <Input
                    placeholder="Household name"
                    value={newHouseholdName}
                    onChange={(e) => setNewHouseholdName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleCreateHousehold} 
                  disabled={creatingHousehold || !newHouseholdName.trim()}
                  className="w-full bg-foodish-500 hover:bg-foodish-600"
                >
                  {creatingHousehold ? 'Creating...' : translate('createNew')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          {currentHousehold && (
            <>
              <Separator className="my-4" />
              
              <div>
                <h3 className="font-medium mb-2">{translate('members')}</h3>
                <div className="space-y-2 mb-4">
                  {currentHousehold.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar 
                          name={member.displayName || member.email} 
                          color={member.avatar_color}
                          size="sm"
                        />
                        <div className="ml-2">
                          <p className="text-sm font-medium">
                            {member.displayName || member.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500">{member.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium mb-1">
                    {translate('invite')} {translate('members')}
                  </h4>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      {inviteError && (
                        <p className="text-xs text-red-500 mt-1">{inviteError}</p>
                      )}
                    </div>
                    <Button 
                      onClick={handleInviteMember} 
                      disabled={sending || !inviteEmail.trim()}
                      className="bg-foodish-500 hover:bg-foodish-600"
                    >
                      {sending ? 'Inviting...' : translate('invite')}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    The user must have an account registered with this email before they can be added.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Language Settings */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">{translate('language')}</h2>
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Logout Button */}
      <Button 
        variant="outline" 
        onClick={handleLogout} 
        className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-100"
      >
        {translate('logout')}
      </Button>
    </div>
  );
};

export default Settings;
