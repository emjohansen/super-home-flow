
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, CheckSquare, ShoppingBag, Settings, StickyNote, PackageOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BottomNavigation = () => {
  const location = useLocation();
  const { translate } = useLanguage();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    {
      path: "/dashboard",
      icon: Home,
      label: translate('dashboard'),
    },
    {
      path: "/recipes",
      icon: BookOpen,
      label: translate('recipes'),
    },
    {
      path: "/chores",
      icon: CheckSquare,
      label: translate('chores'),
    },
    {
      path: "/shopping",
      icon: ShoppingBag,
      label: translate('shopping'),
    },
    {
      path: "/notes",
      icon: StickyNote,
      label: translate('notes'),
    },
    {
      path: "/storage",
      icon: PackageOpen,
      label: translate('storage'),
    },
    {
      path: "/settings",
      icon: Settings,
      label: translate('settings'),
    },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 dark:border-gray-800 flex items-center justify-around z-50 animate-slide-in-bottom">
      {navItems.map(item => (
        <Link 
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center justify-center w-1/7 h-full ${
            isActive(item.path) 
              ? 'text-foodish-500 font-medium' 
              : 'text-gray-500 hover:text-foodish-500'
          }`}
        >
          <item.icon className={`h-5 w-5 ${isActive(item.path) ? 'text-foodish-500' : 'text-gray-500'}`} />
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default BottomNavigation;
