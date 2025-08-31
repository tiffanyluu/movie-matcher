import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: 'movies' | 'dashboard';
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">🍿 MovieMatcher 🎬</h1>
              <nav className="flex space-x-4">
                <Link 
                  to="/movies" 
                  className={currentPage === 'movies' 
                    ? 'text-primary-600 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                >
                  Browse Movies
                </Link>
                <Link 
                  to="/dashboard" 
                  className={currentPage === 'dashboard' 
                    ? 'text-primary-600 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                >
                  My Recommendations
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Hello, {user?.name}</span>
              <button 
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;