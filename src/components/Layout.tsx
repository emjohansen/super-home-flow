
import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { currentUser } = useAuth();

  return (
    <div className="foodish-container">
      <div className="page-container">
        <Outlet />
      </div>
      {currentUser && <BottomNavigation />}
    </div>
  );
};

export default Layout;
