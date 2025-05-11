
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, CheckSquare, ShoppingBag, Settings, StickyNote, PackageOpen, Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BottomNavigation = () => {
  const location = useLocation();
  const { translate } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isActive = (path: string) => location.pathname === path;
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu when a route is clicked
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  
  const mainNavItems = [
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
      path: "/storage",
      icon: PackageOpen,
      label: translate('storage'),
    },
  ];

  const menuItems = [
    {
      path: "/notes",
      icon: StickyNote,
      label: translate('notes'),
    },
    {
      path: "/settings",
      icon: Settings,
      label: translate('settings'),
    },
  ];
  
  return (
    <div 
      ref={menuRef}
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-100 dark:border-gray-800 flex flex-col z-50 animate-slide-in-bottom"
    >
      {menuOpen && (
        <div className="flex items-center justify-around border-b border-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out">
          {menuItems.map(item => (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center h-16 w-1/5 ${
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
      )}
      <div className="h-16 flex items-center justify-around">
        {mainNavItems.map(item => (
          <Link 
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center h-full w-1/5 ${
              isActive(item.path) 
                ? 'text-foodish-500 font-medium' 
                : 'text-gray-500 hover:text-foodish-500'
            }`}
          >
            <item.icon className={`h-5 w-5 ${isActive(item.path) ? 'text-foodish-500' : 'text-gray-500'}`} />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex flex-col items-center justify-center h-full w-1/5 ${
            menuOpen || isActive('/notes') || isActive('/settings')
              ? 'text-foodish-500 font-medium' 
              : 'text-gray-500 hover:text-foodish-500'
          }`}
        >
          <Menu className={`h-5 w-5 ${
            menuOpen || isActive('/notes') || isActive('/settings') 
              ? 'text-foodish-500' 
              : 'text-gray-500'
          }`} />
          <span className="text-xs mt-1">{translate('more')}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
