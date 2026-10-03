import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LifeBuoy, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-brand-600 text-white p-2 rounded-lg">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <Link to="/" className="text-xl font-bold text-gray-900 hover:text-brand-600 transition-colors">
                Resolvify
              </Link>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100">
                E-Commerce Support
              </span>
            </div>
          </div>

          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{user.name}</span>
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono font-semibold">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 font-medium px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-brand-600 px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
