import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import components from their new files
import AuthPage from './components/Auth';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import DashboardContent from './components/DashboardContent';
import OnboardingContent from './components/OnboardingContent';
import AdminPanel from './components/Admin';
import AdminDashboard from './components/AdminDashboard';

// Main App component
export default function App() {
  // State to store authenticated user data (derived from token or fetched)
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // To check for token on load

  // Check for existing token in localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log("Found token in localStorage.");
       try {
         const base64Url = token.split('.')[1];
         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
         const decodedPayload = JSON.parse(atob(base64));
         setUser(decodedPayload); // Assuming user info is in the JWT payload
         console.log("Decoded user from token:", decodedPayload);
       } catch (error) {
         console.error("Failed to decode token:", error);
         localStorage.removeItem('token'); // Remove invalid token
       }
    }
    setLoadingAuth(false); // Finished checking for token
  }, []);

  // Function to handle successful authentication (login or signup)
  const handleAuthSuccess = (userData, token) => {
    console.log('Authentication successful:', userData);
    localStorage.setItem('token', token); // Store token
    setUser(userData); // Set user state
  };

  // Function to handle authentication errors
  const handleAuthError = (errorMessage) => {
    console.error('Authentication failed:', errorMessage);
    // You might want to display this message to the user in the UI
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token
    setUser(null); // Clear user state
  };

  // If still checking for auth status, show loading or null
  if (loadingAuth) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-100">Loading authentication status...</div>; // Or a loading spinner
  }

  return (
    // Router component wraps your application
    <Router>
      {/* Routes define which component to render based on the URL */}
      <Routes>
        {/* Route for Login/Signup page */}
        {/* If user is logged in, redirect from login/signup to dashboard */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} onAuthError={handleAuthError} />
            )
          }
        />

        {/* Protected Routes wrapped in AuthenticatedLayout */}
        {/* The parent route element renders the layout */}
        <Route path="/" element={<AuthenticatedLayout user={user} onLogout={handleLogout} />}>
          {/* Child routes render their elements within the parent's Outlet */}
          {/* If user is not logged in, AuthenticatedLayout will handle redirection */}
          <Route path="dashboard" element={
            user && user.role === 'admin' ? (
              <AdminDashboard user={user} />
            ) : (
              <DashboardContent user={user} />
            )
          } />
          <Route path="onboarding" element={<OnboardingContent user={user} />} />

          {/* Admin route with role check - now a parent route for admin sub-routes */}
          <Route
            path="admin" // Note: relative path
            element={
              user && user.role === 'admin' ? (
                <AdminPanel user={user} /> // Render the main AdminPanel component
              ) : (
                // Render access denied message directly or redirect
                <div className="p-4 text-center text-red-600">Access Denied. You must be an admin.</div>
              )
            }
          >
            {/* Nested routes within the AdminPanel */}
            {/* Default admin route - show pending applications */}
            <Route index element={<AdminPanel.PendingApplications user={user} />} />
            <Route path="pending-applications" element={<AdminPanel.PendingApplications user={user} />} />
            <Route path="application/:applicationId" element={<AdminPanel.ApplicationDetails user={user} />} />
          </Route>

           {/* Add more nested routes for other protected pages */}
           {/* Example: Default protected route if navigating to / without a specific child path */}
           {/* <Route index element={<Navigate to="dashboard" replace />} /> */}
        </Route>


        {/* Fallback route for 404 - Redirect to home or show a 404 component */}
        {/* This route should be outside the AuthenticatedLayout route */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}
