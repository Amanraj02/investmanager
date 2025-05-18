import React, { useState } from 'react';

// Component that holds both Login and Signup forms
export default function AuthPage({ onAuthSuccess, onAuthError }) {
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
    // Outer container for grey background and centering
    <div className="min-h-screen bg-gray-300 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* White box container for the form */}
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg"> {/* Added bg-white, p-8, rounded-lg, shadow-lg */}
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
    </div>
  );
}


// Login Form Component
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
          Email
        </label>
        <input
          id="username"
          name="username"
          type="email"
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

// Signup Form Component
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
          Email
        </label>
        <input
          id="new-username"
          name="new-username"
          type="email"
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
