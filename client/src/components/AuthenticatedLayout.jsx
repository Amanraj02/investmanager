import React from 'react';
import { Link, Outlet, Navigate } from 'react-router-dom';

// Layout component for authenticated users with a sidebar
export default function AuthenticatedLayout({ user, onLogout }) {
  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-300 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b bg-indigo-300 border-indigo-700 text-indigo-700">
          InvestFund Platform
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <Link to="/dashboard" className="block px-3 py-2 rounded-md text-sm font-medium bg-indigo-500 hover:bg-indigo-500 text-white">
            Dashboard
          </Link>
          <Link to="/onboarding" className="block px-3 py-2 rounded-md text-sm font-medium  bg-indigo-500 hover:bg-indigo-500 text-white">
            Client Onboarding
          </Link>
          {/* Show Admin link only if user is admin */}
          {user && user.role === 'admin' && (
            <Link to="/admin" className="block px-3 py-2 rounded-md text-sm font-medium  bg-indigo-500 hover:bg-indigo-500 text-white">
              Admin Panel
            </Link>
          )}
          {/* Add more navigation links here */}
        </nav>
        {/* Logout button at the bottom of the sidebar */}
        <div className="p-4 border-t border-gray-700">
           <button
              onClick={onLogout}
              className="flex justify-center w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 border border-transparent rounded-md shadow-sm  focus:outline-none focus:ring-2 focus:ring-offset-2 "
            >
              Logout
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* The specific page content will be rendered here via Outlet */}
        <Outlet /> {/* This is where the matched child route element will render */}
      </div>
    </div>
  );
}
