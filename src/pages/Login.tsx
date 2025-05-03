
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { translate } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to log in. Please check your credentials.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-foodish-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foodish-600">FooDish</h1>
          <p className="text-gray-600 mt-2">{translate('welcomeBack')}</p>
        </div>
        
        <Card className="border-foodish-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center">{translate('login')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {translate('email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    {translate('password')}
                  </label>
                  <Link to="/forgot-password" className="text-sm text-foodish-600 hover:underline">
                    {translate('forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-foodish-500 hover:bg-foodish-600"
                disabled={loading}
              >
                {loading ? 'Logging in...' : translate('login')}
              </Button>
              <p className="text-sm text-center text-gray-600">
                {translate("Don't have an account?")} {" "}
                <Link to="/signup" className="text-foodish-600 hover:underline">
                  {translate('signup')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
        
        {/* Demo credentials */}
        <div className="mt-6 text-center bg-gray-100 rounded-lg p-3">
          <p className="text-sm text-gray-600">Demo Credentials</p>
          <p className="text-sm font-medium">Email: user@example.com</p>
          <p className="text-sm font-medium">Password: password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
