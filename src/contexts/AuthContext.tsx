
import React, { createContext, useState, useContext, useEffect } from 'react';

// Mock Firebase auth structure for this initial implementation
export type User = {
  id: string;
  email: string;
  displayName: string | null;
  avatarColor: string;
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock users database
  const mockUsers: Record<string, { password: string; userData: User }> = {
    'user@example.com': {
      password: 'password123',
      userData: {
        id: '1',
        email: 'user@example.com',
        displayName: 'Demo User',
        avatarColor: '#4A9F41',
      },
    },
  };

  // Simulate an auth state change listener
  useEffect(() => {
    // Check if we have a saved user in localStorage
    const savedUser = localStorage.getItem('foodish_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  async function login(email: string, password: string) {
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const userRecord = mockUsers[email.toLowerCase()];
        if (userRecord && userRecord.password === password) {
          setCurrentUser(userRecord.userData);
          localStorage.setItem('foodish_current_user', JSON.stringify(userRecord.userData));
          setLoading(false);
          resolve();
        } else {
          setLoading(false);
          reject(new Error('Invalid email or password'));
        }
      }, 1000); // Simulate network delay
    });
  }

  // Sign up function
  async function signup(email: string, password: string) {
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (mockUsers[email.toLowerCase()]) {
          setLoading(false);
          reject(new Error('Email already in use'));
        } else {
          // Create new user
          const newUser = {
            id: Math.random().toString(36).substring(2, 15),
            email: email.toLowerCase(),
            displayName: null,
            avatarColor: '#4A9F41', // Default green color
          };
          
          // Save to our mock database
          mockUsers[email.toLowerCase()] = {
            password,
            userData: newUser,
          };
          
          setCurrentUser(newUser);
          localStorage.setItem('foodish_current_user', JSON.stringify(newUser));
          setLoading(false);
          resolve();
        }
      }, 1000); // Simulate network delay
    });
  }

  // Logout function
  async function logout() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setCurrentUser(null);
        localStorage.removeItem('foodish_current_user');
        resolve();
      }, 500);
    });
  }

  // Reset password function
  async function resetPassword(email: string) {
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const userRecord = mockUsers[email.toLowerCase()];
        if (userRecord) {
          // In a real app, would send reset email
          console.log(`Password reset email sent to ${email}`);
          setLoading(false);
          resolve();
        } else {
          setLoading(false);
          reject(new Error('No user found with that email'));
        }
      }, 1000);
    });
  }

  // Update profile function
  async function updateProfile(data: Partial<User>) {
    setLoading(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (currentUser) {
          const updatedUser = { ...currentUser, ...data };
          setCurrentUser(updatedUser);
          localStorage.setItem('foodish_current_user', JSON.stringify(updatedUser));
          
          // Update in mock database
          if (mockUsers[currentUser.email]) {
            mockUsers[currentUser.email].userData = updatedUser;
          }
        }
        setLoading(false);
        resolve();
      }, 1000);
    });
  }

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
