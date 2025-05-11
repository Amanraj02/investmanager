import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Import recharts components
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// Basic Dashboard Content Component
export default function DashboardContent({ user }) {
  const [dashboardMessage, setDashboardMessage] = useState('');
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState('unknown'); // State for onboarding status

  // Dummy data for fund performance
  const dummyFundPerformance = {
    lastMonth: '+2.5%',
    lastYear: '+15.8%',
    // Add more dummy data as needed
  };

  // Dummy data for the investment performance chart
  // This represents a simplified time series of portfolio value or index performance
  const performanceData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 4500 },
    { name: 'May', value: 6000 },
    { name: 'Jun', value: 5500 },
    { name: 'Jul', value: 7000 },
    { name: 'Aug', value: 6500 },
    { name: 'Sep', value: 8000 },
    { name: 'Oct', value: 7500 },
    { name: 'Nov', value: 9000 },
    { name: 'Dec', value: 8500 },
  ];


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

   // Fetch onboarding status when the component mounts or user changes
   // Only fetch if the user is NOT an admin
   const fetchOnboardingStatus = async () => {
       if (!user || !user.id || user.role === 'admin') return; // Don't fetch if user is not logged in, has no ID, or is admin

       const token = localStorage.getItem('token');
       if (!token) {
           setOnboardingStatus('not_started'); // Assume not started if no token (shouldn't happen in protected route)
           return;
       }

       try {
           // Fetch status from the backend endpoint
           const response = await fetch(`http://localhost:3001/api/user/onboarding-status/${user.id}`, {
               method: 'GET',
               headers: {
                   'Authorization': `Bearer ${token}`,
                   'Content-Type': 'application/json',
               },
           });

           // Check if the response is OK before trying to parse JSON
           if (!response.ok) {
               const errorText = await response.text(); // Read error response as text
               console.error('Error fetching onboarding status:', response.status, errorText);
               // Handle errors based on status code or error text
               setOnboardingStatus('not_started'); // Default to not started on error
               return;
           }

           const data = await response.json();

           // Assuming backend returns { status: 'pending' | 'approved' | 'rejected' | 'not_started' }
           setOnboardingStatus(data.status);

       } catch (error) {
           console.error('Onboarding status fetch error:', error);
           setOnboardingStatus('not_started'); // Default to not started on network error
       }
   };


  // Fetch dashboard data and onboarding status when the component mounts or user changes
  useEffect(() => {
    if (user) { // Only fetch if user is authenticated
      fetchDashboardData();
      // Only fetch onboarding status if the user is NOT an admin
      if (user.role !== 'admin') {
         fetchOnboardingStatus();
      }
    }
  }, [user]); // Refetch if user state changes


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      {user ? (
        // Wrap the content inside the conditional with a single div
        <div className="space-y-6"> {/* Added this wrapping div */}
          <p className="text-gray-700">Welcome, {user.username}!</p>
          <p className="text-gray-700">Your role is: {user.role}</p>

          {/* Display Onboarding Status - Only for non-admin users */}
          {user.role !== 'admin' && (
             <div className={`p-3 rounded-md text-sm font-semibold ${
                 onboardingStatus === 'approved' ? 'bg-green-100 text-green-700' :
                 onboardingStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                 onboardingStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                 'bg-blue-100 text-blue-700' // 'unknown' or 'not_started'
             }`}>
                 Onboarding Status: {onboardingStatus.replace('_', ' ').toUpperCase()}
                 {onboardingStatus === 'not_started' && (
                     <Link to="/onboarding" className="ml-2 text-indigo-600 hover:underline">
                         Start Onboarding
                     </Link>
                 )}
             </div>
          )}


          {/* Display message from backend */}
          {loadingDashboard ? (
            <p className="text-blue-600">Loading dashboard data...</p>
          ) : (
            dashboardMessage && <p className="text-gray-600">{dashboardMessage}</p>
          )}

          {/* Fund Performance Section */}
          <div className="bg-white p-6 rounded-lg shadow">
             <h3 className="text-xl font-semibold text-gray-800 mb-4">Fund Performance</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <p><strong>Last 1 Month:</strong> <span className="font-semibold text-green-600">{dummyFundPerformance.lastMonth}</span></p>
                <p><strong>Last 1 Year:</strong> <span className="font-semibold text-green-600">{dummyFundPerformance.lastYear}</span></p>
                {/* Add more performance metrics here */}
             </div>
          </div>


          {/* Investment Performance Chart */}
           <div className="bg-white p-6 rounded-lg shadow col-span-1 md:col-span-2">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Investment Performance Chart</h3>
                <div style={{ width: '100%', height: 300 }}> {/* Container for the chart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
             </div>


        </div> // Added this closing div
      ) : (
        <p className="text-red-600">User data not available.</p>
      )}
    </div>
  );
}
