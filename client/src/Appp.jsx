import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link, Outlet } from 'react-router-dom'; // Import Outlet

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
          <Route path="dashboard" element={<DashboardContent user={user} />} /> {/* Note: relative path */}
          <Route path="onboarding" element={<OnboardingContent user={user} />} /> {/* Note: relative path */}
          {/* Admin route with role check */}
          <Route
            path="admin" // Note: relative path
            element={
              user && user.role === 'admin' ? (
                <AdminContent user={user} />
              ) : (
                // Render access denied message directly or redirect
                <div className="p-4 text-center text-red-600">Access Denied. You must be an admin.</div>
              )
            }
          />
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

// Layout component for authenticated users with a sidebar
function AuthenticatedLayout({ user, onLogout }) {
  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          Fund Platform
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <Link to="/dashboard" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
            Dashboard
          </Link>
          <Link to="/onboarding" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
            Client Onboarding
          </Link>
          {/* Show Admin link only if user is admin */}
          {user && user.role === 'admin' && (
            <Link to="/admin" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
              Admin Panel
            </Link>
          )}
          {/* Add more navigation links here */}
        </nav>
        {/* Logout button at the bottom of the sidebar */}
        <div className="p-4 border-t border-gray-700">
           <button
              onClick={onLogout}
              className="flex justify-center w-full px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

// Component that holds both Login and Signup forms
function AuthPage({ onAuthSuccess, onAuthError }) {
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState(''); // State for displaying messages (success/error)

   // Function to handle successful authentication (passed from App)
  const handleAuthSuccessInternal = (userData, token) => {
    setMessage(`Authentication successful!`); // Show brief success message on auth page
    onAuthSuccess(userData, token); // Call parent handler to update user state and store token
  };

   // Function to handle authentication errors (passed from App)
  const handleAuthErrorInternal = (errorMessage) => {
     setMessage(`Authentication failed: ${errorMessage}`); // Show error message on auth page
     onAuthError(errorMessage); // Call parent handler to log error
  };


  return (
    <div className="space-y-6 w-full max-w-md mx-auto"> {/* Added max-w-md and mx-auto for centering */}
       {/* Display messages */}
        {message && (
          <div className={`p-3 text-sm rounded-md ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
      {isLogin ? (
        <LoginForm
          onSwitchToSignup={() => { setIsLogin(false); setMessage(''); }} // Clear message on switch
          onAuthSuccess={handleAuthSuccessInternal}
          onAuthError={handleAuthErrorInternal}
        />
      ) : (
        <SignupForm
          onSwitchToLogin={() => { setIsLogin(true); setMessage(''); }} // Clear message on switch
          onAuthSuccess={handleAuthSuccessInternal} // Pass auth success handler
          onAuthError={handleAuthErrorInternal} // Pass auth error handler
        />
      )}
    </div>
  );
}


// Login Form Component (mostly unchanged, now calls onAuthSuccess with token)
function LoginForm({ onSwitchToSignup, onAuthSuccess, onAuthError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful - call parent handler with user data AND token
        onAuthSuccess(data.user, data.accessToken); // Pass token here
      } else {
        // Login failed
        onAuthError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login fetch error:', error);
      onAuthError('An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-900">Sign in to your account</h2>
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center justify-between">
        {/* Remember Me and Forgot Password could go here */}
      </div>
      <div>
        <button
          type="submit"
          className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign in'}
        </button>
      </div>
      <div className="text-sm text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            className="font-medium text-indigo-600 hover:text-indigo-500"
            onClick={onSwitchToSignup}
            disabled={isLoading}
          >
            Sign up
          </button>
        </p>
      </div>
    </form>
  );
}

// Signup Form Component (mostly unchanged)
function SignupForm({ onSwitchToLogin, onAuthSuccess, onAuthError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      onAuthError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Signup successful - call parent handler (no token needed for signup success)
        onAuthSuccess({ username }); // Pass username or relevant data
        onSwitchToLogin(); // Switch back to login form after successful signup
      } else {
         onAuthError(data.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup fetch error:', error);
      onAuthError('An error occurred during signup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gray-900">Create a new account</h2>
       <div>
        <label htmlFor="new-username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="new-username"
          name="new-username"
          type="text"
          autoComplete="username"
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="new-password"
          name="new-password"
          type="password"
          autoComplete="new-password"
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
       <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          name="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <button
          type="submit"
          className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Signing Up...' : 'Sign up'}
        </button>
      </div>
      <div className="text-sm text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            className="font-medium text-indigo-600 hover:text-indigo-500"
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
}

// Basic Dashboard Content Component (replaces the old Dashboard component's content)
function DashboardContent({ user }) {
  const [dashboardMessage, setDashboardMessage] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Example of fetching protected data from the backend
  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    const token = localStorage.getItem('token'); // Get the token

    if (!token) {
      setDashboardMessage('No token found. Please log in.');
      setLoadingDashboard(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDashboardMessage(data.message); // Display message from protected route
        console.log('Dashboard data:', data);
        // You would typically set state with actual dashboard data here
      } else {
        setDashboardMessage(`Error fetching dashboard data: ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setDashboardMessage('An error occurred while fetching dashboard data.');
    } finally {
      setLoadingDashboard(false);
    }
  };

  // Fetch dashboard data when the component mounts or user changes
  useEffect(() => {
    if (user) { // Only fetch if user is authenticated
      fetchDashboardData();
    }
  }, [user]); // Refetch if user state changes


  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      {user ? (
        <>
          <p className="text-gray-700">Welcome, {user.username}!</p>
          <p className="text-gray-700">Your role is: {user.role}</p>

          {/* Display message from backend */}
          {loadingDashboard ? (
            <p className="text-blue-600">Loading dashboard data...</p>
          ) : (
            dashboardMessage && <p className="text-gray-600">{dashboardMessage}</p>
          )}

          {/* Add actual dashboard content here */}
          <p>This is where your investment summaries, portfolio charts, etc. will go.</p>
        </>
      ) : (
        <p className="text-red-600">User data not available.</p>
      )}
    </div>
  );
}

// Placeholder components for other routes - now just content
function OnboardingContent({ user }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Client Onboarding Process</h2>
      <p className="text-gray-700">Welcome to the onboarding process, {user.username}!</p>
      {/* Onboarding form/steps go here */}
      <p>This section will contain the steps for clients to provide their information and set up their account.</p>
    </div>
  );
}

function AdminContent({ user }) {
   return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Admin Panel - Management Tools</h2>
      <p className="text-gray-700">Welcome to the admin panel, {user.username}!</p>
      <p className="text-red-600">Caution: Admin privileges active.</p>
      {/* Admin tools and data go here */}
      <p>Here admins can manage users, funds, review onboarding applications, etc.</p>
    </div>
  );
}
