
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, currentUser } = useAuth();
  const { translate } = useLanguage();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !displayName) {
      toast.error(translate('Please fill in all fields'));
      return;
    }
    
    if (password.length < 6) {
      toast.error(translate('Password must be at least 6 characters'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password, displayName);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(translate('Account created successfully'));
        toast.info(translate('You can now sign in with your credentials'));
        navigate('/login');
      }
    } catch (error) {
      toast.error(translate('An error occurred during signup'));
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-foodish-600">Foodish</CardTitle>
          <CardDescription>
            {translate('Create a new account')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="display-name" className="text-sm font-medium">
                {translate('Display Name')}
              </label>
              <Input
                id="display-name"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {translate('Email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {translate('Password')}
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500">
                {translate('Password must be at least 6 characters')}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-foodish-500 hover:bg-foodish-600"
              disabled={isLoading}
            >
              {isLoading ? translate('Creating Account...') : translate('Create Account')}
            </Button>
            <div className="text-sm text-center">
              {translate('Already have an account?')}{' '}
              <Link to="/login" className="text-foodish-600 hover:underline">
                {translate('Sign In')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
