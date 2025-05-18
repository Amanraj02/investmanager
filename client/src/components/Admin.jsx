import React, { useState, useEffect } from 'react';
import { Link, Outlet, useParams, useNavigate } from 'react-router-dom';

// Helper function to safely parse JSON arrays from string data
// Returns an empty array if parsing fails or if result is not an array
const parseJsonArray = (jsonString) => {
    try {
        const parsed = JSON.parse(jsonString);
        // Check if the parsed result is an array
        if (Array.isArray(parsed)) {
            return parsed;
        }
        // Log a warning only if the parsed result is NOT an array
        console.warn("JSON.parse result was not an array:", parsed);
        return []; // Return empty array if parsing fails or result is not an array
    } catch (e) {
        console.error("Error parsing JSON string:", jsonString, e);
        return []; // Return empty array on parsing error
    }
};

// Helper function to render file links in a user-friendly way
// Extracts filename from path and creates a clickable link
const renderFileLink = (filePath) => {
    if (!filePath) return 'No file uploaded';
    // Extract filename from the path string manually (no Node.js 'path' module needed)
    const parts = filePath.split(/[\\/]/); // Split by both backslash and forward slash
    const filename = parts[parts.length - 1]; // Get the last part
    // In a real app, you'd need a backend endpoint to serve these files securely
    // For now, just display the filename and simulate a download
    return <span className="text-indigo-600 cursor-pointer hover:underline" onClick={() => alert(`Simulating download for: ${filePath}`)}>{filename}</span>;
};

// Main Admin Panel Component - Acts as a layout for admin sub-routes
// Provides navigation and access control for admin features
export default function AdminPanel({ user }) {
    // Basic check if user is admin (though routing already handles this)
    if (!user || user.role !== 'admin') {
        return <div className="p-4 text-center text-red-600">Access Denied. You must be an admin.</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-gray-700">Welcome to the admin panel, {user.username}!</p>

            {/* Admin Navigation (could be a sub-sidebar or tabs) */}
            <nav className="flex space-x-4 border-b pb-2">
                <Link to="/admin/pending-applications" className="text-indigo-600 hover:underline">Pending Applications</Link>
                {/* Add more admin links here */}
                {/* <Link to="/admin/users" className="text-indigo-600 hover:underline">Manage Users</Link> */}
                {/* <Link to="/admin/funds" className="text-indigo-600 hover:underline">Manage Funds</Link> */}
            </nav>

            {/* This Outlet will render the matched admin sub-route components */}
            <Outlet />
        </div>
    );
}

// Component to list and manage pending onboarding applications
// Includes filtering, assignment management, and status updates
AdminPanel.PendingApplications = function PendingApplications({ user }) {
    // State management for applications list and UI
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
    const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
    const [employees, setEmployees] = useState([]); // Add state for employees
    const navigate = useNavigate();

    // Function to fetch all applications from the backend
    // Handles authentication and error states
    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');

        if (!token) {
            setError("Authentication token not found.");
            setLoading(false);
            return;
        }

        try {
            console.log('Fetching applications...'); // Debug log
            const response = await fetch('http://localhost:3001/api/admin/onboarding/pending', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error fetching applications:', response.status, errorText);
                setError(`Failed to fetch applications: ${errorText}`);
                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log('Fetched applications data:', data); // Debug log

            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.error('Received non-array data:', data);
                setError('Invalid data format received from server');
                setLoading(false);
                return;
            }

            setApplications(data);

        } catch (err) {
            console.error('Fetch applications error:', err);
            setError('An error occurred while fetching applications.');
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch list of available employees for assignment
    // Used to populate the employee dropdown
    const fetchEmployees = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:3001/api/admin/employees', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error('Failed to fetch employees:', response.status);
                return;
            }

            const data = await response.json();
            setEmployees(data);
        } catch (err) {
            console.error('Fetch employees error:', err);
        }
    };

    // Effect hook to load applications and employees when component mounts
    // Only runs if user is admin
    useEffect(() => {
        if (user && user.role === 'admin') {
            console.log('Component mounted, fetching applications...'); // Debug log
            fetchApplications();
            fetchEmployees();
        }
    }, [user]);

    // Effect hook to handle application updates
    // Listens for custom events to refresh the list
    useEffect(() => {
        const handleApplicationUpdate = () => {
            console.log('Application update detected, refreshing list...');
            fetchApplications();
        };

        window.addEventListener('applicationUpdated', handleApplicationUpdate);

        return () => {
            window.removeEventListener('applicationUpdated', handleApplicationUpdate);
        };
    }, []);

    // Navigation handler for viewing application details
    const handleViewDetails = (applicationId) => {
        navigate(`/admin/application/${applicationId}`);
    };

    // Helper function to get employee details by ID
    // Returns formatted string with name and position
    const getEmployeeName = (employeeId) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? `${employee.name} (${employee.position})` : 'Unknown Employee';
    };

    // Filter applications based on selected status and assignment
    // Combines both filters for refined results
    const filteredApplications = applications.filter(app => {
        // Status filter
        const statusMatch = filter === 'all' || (app.application_status || '').toLowerCase() === filter.toLowerCase();
        
        // Assignment filter
        const assignmentMatch = assignmentFilter === 'all' || 
            (assignmentFilter === 'assigned' && app.assigned_to_employee_id) ||
            (assignmentFilter === 'unassigned' && !app.assigned_to_employee_id);

        return statusMatch && assignmentMatch;
    });

    // Helper function to get appropriate badge color based on status
    // Used for visual status indication
    const getStatusBadgeColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Render the applications list with filters and actions
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">Onboarding Applications</h3>
                <div className="flex items-center space-x-4">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select
                        value={assignmentFilter}
                        onChange={(e) => setAssignmentFilter(e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Assignments</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                    </select>
                    <button
                        onClick={fetchApplications}
                        className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Refresh List
                    </button>
                </div>
            </div>

            {loading && <p className="text-blue-600">Loading applications...</p>}
            {error && <p className="text-red-600">Error: {error}</p>}

            {!loading && !error && (
                filteredApplications.length > 0 ? (
                    <ul className="space-y-4">
                        {filteredApplications.map(app => (
                            <li key={app.id} className="bg-white p-4 rounded-md shadow flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">Application ID: {app.id}</p>
                                    <p className="text-sm text-gray-600">Submitted by User ID: {app.user_id}</p>
                                    <p className="text-sm text-gray-600">
                                        Status: <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(app.application_status)}`}>
                                            {app.application_status}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-600">Submitted On: {new Date(app.submission_date).toLocaleDateString()}</p>
                                    {app.assigned_to_employee_id ? (
                                        <p className="text-sm text-gray-600">
                                            Assigned to: {getEmployeeName(app.assigned_to_employee_id)}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-600">Not assigned to any employee</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleViewDetails(app.id)}
                                    className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    View Details
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">No applications found.</p>
                )
            )}
        </div>
    );
}

// Component to view and manage individual application details
// Handles employee assignment and status updates
AdminPanel.ApplicationDetails = function ApplicationDetails({ user }) {
    // State management for application details and UI
    const { applicationId } = useParams(); // Get application ID from URL params
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignedEmployee, setAssignedEmployee] = useState(''); // State for assigning employee
    const [employees, setEmployees] = useState([]); // State for list of employees
    const navigate = useNavigate();

    // Effect hook to load application details and employees
    // Runs when component mounts or when applicationId changes
    useEffect(() => {
        const fetchApplicationDetails = async () => {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            if (!token) {
                setError("Authentication token not found.");
                setLoading(false);
                return;
            }

            try {
                // Fetch application details from the backend endpoint
                const response = await fetch(`http://localhost:3001/api/admin/onboarding/application/${applicationId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                 // Check if the response is OK before trying to parse JSON
                if (!response.ok) {
                   const errorText = await response.text(); // Read error response as text
                   console.error('Error fetching application details:', response.status, errorText);
                   setError(`Failed to fetch application details: ${errorText}`);
                   setLoading(false);
                   return;
                }

                const data = await response.json();

                setApplication(data); // Assuming backend returns the full application object
                // Set initial assigned employee if available
                if (data.assigned_to_employee_id) {
                    setAssignedEmployee(data.assigned_to_employee_id.toString()); // Convert ID to string for select value
                }

            } catch (err) {
                console.error('Fetch application details error:', err);
                setError(`An error occurred while fetching application details for ID ${applicationId}.`);
            } finally {
                setLoading(false);
            }
        };

        const fetchEmployees = async () => {
             const token = localStorage.getItem('token');
              if (!token) return;

             try {
                 // Fetch employees from the backend endpoint
                 const response = await fetch('http://localhost:3001/api/admin/employees', {
                     method: 'GET',
                     headers: {
                         'Authorization': `Bearer ${token}`,
                         'Content-Type': 'application/json',
                     },
                 });

                  // Check if the response is OK before trying to parse JSON
                 if (!response.ok) {
                    const errorText = await response.text(); // Read error response as text
                    console.error('Failed to fetch employees:', response.status, errorText);
                    // Decide how to handle this error - maybe just log it and leave dropdown empty
                    return; // Stop execution if response is not OK
                 }


                 const data = await response.json();

                 setEmployees(data); // Assuming backend returns [{ id: 1, name: 'employee1' }, ...]

             } catch (err) {
                 console.error('Fetch employees error:', err);
                 // Decide how to handle this error
             }
        };


        if (user && user.role === 'admin' && applicationId) {
             fetchApplicationDetails();
             fetchEmployees(); // Fetch employees when details page loads
        } else if (!applicationId) {
            setError("No application ID provided.");
            setLoading(false);
        }

    }, [user, applicationId]); // Refetch if user or application ID changes

    // Handler for assigning an employee to the application
    // Updates backend and local state
    const handleAssignEmployee = async () => {
        if (!assignedEmployee || !applicationId) {
            alert("Please select an employee to assign.");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert("Authentication token not found.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/admin/onboarding/application/${applicationId}/assign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ assignedToEmployeeId: parseInt(assignedEmployee, 10) })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to assign employee:', response.status, errorData.error);
                alert(`Failed to assign employee: ${errorData.error || response.statusText}`);
                return;
            }

            const result = await response.json();
            alert('Employee assigned successfully!');
            
            if (application) {
                setApplication({ ...application, assigned_to_employee_id: parseInt(assignedEmployee, 10) });
            }

            // Dispatch event to notify that an application was updated
            window.dispatchEvent(new Event('applicationUpdated'));

        } catch (err) {
            console.error('Assign employee error:', err);
            alert('An error occurred while assigning employee.');
        }
    };

     // Handler for updating application status
    // Updates backend and local state, may navigate back to list
    const handleUpdateStatus = async (newStatus) => {
        if (!applicationId || !newStatus) {
             alert("Invalid status provided.");
             return;
        }

        const token = localStorage.getItem('token');
         if (!token) {
             alert("Authentication token not found.");
             return;
         }

        try {
            const response = await fetch(`http://localhost:3001/api/admin/onboarding/application/${applicationId}/status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

             // Check if the response is OK before trying to parse JSON
            if (!response.ok) {
               const errorData = await response.json(); // Assuming error response is JSON
               console.error('Failed to update status:', response.status, errorData.error);
               alert(`Failed to update status: ${errorData.error || response.statusText}`);
               return; // Stop execution if response is not OK
            }

            const result = await response.json();

            alert(`Application status updated to ${newStatus}!`);
            // Update local state or refetch details to show the new status
             if (application) {
                setApplication({ ...application, status: newStatus });
            }

            // Dispatch event to notify that an application was updated
            window.dispatchEvent(new Event('applicationUpdated'));

            // Only navigate back to pending applications if the status is not 'pending'
            if (newStatus !== 'pending') {
                navigate('/admin/pending-applications');
            }

        } catch (err) {
            console.error('Update status error:', err);
            alert('An error occurred while updating status.');
        }
    };

    // Loading and error states
    if (loading) {
        return <p className="text-blue-600">Loading application details...</p>;
    }

    if (error) {
        return <p className="text-red-600">Error: {error}</p>;
    }

    if (!application) {
        return <p className="text-gray-600">Application details not found.</p>;
    }

    // Render the application details view with actions
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800">Application Details (ID: {application.id})</h3>
            <button
                 onClick={() => navigate('/admin/pending-applications')}
                 className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
             >
                 Back to Pending Applications
             </button>

            <div className="border p-6 rounded-md shadow space-y-4 text-sm text-gray-700">
                <h4 className="text-lg font-medium text-gray-800 border-b pb-2">Applicant Information</h4>
                <p><strong>User ID:</strong> {application.user_id}</p>
                 {/* You might want to fetch username from user_id here in a real app */}
                <p><strong>Full Name:</strong> {application.full_name}</p>
                <p><strong>Email:</strong> {application.email}</p>
                <p><strong>Mobile:</strong> {application.mobile}</p>
                 <p><strong>Govt ID Number:</strong> {application.govt_id_number}</p>


                <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Investment Profile</h4>
                 <p><strong>Time Horizon:</strong> {application.time_horizon} years</p>
                 <p><strong>Risk Tolerance:</strong> {application.risk_tolerance}</p>
                 {/* Use the safe parsing helper */}
                 <p><strong>Investments Owned:</strong> {parseJsonArray(application.investments_owned).join(', ') || 'None selected'}</p>
                 <p><strong>Acceptable Annual Return:</strong> {application.acceptable_annual_return}</p>

                 <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Client Details</h4>
                 <p><strong>Date of Birth:</strong> {application.dob}</p>
                 <p><strong>Nationality:</strong> {application.nationality}</p>
                 <p><strong>Address:</strong> {application.address}</p>
                 <p><strong>Client Type:</strong> {application.client_type}</p>
                 <p><strong>Govt ID File:</strong> {renderFileLink(application.govt_id_file_path)}</p>
                 <p><strong>Additional Contact Details:</strong> {application.contact_details || 'N/A'}</p>

                 <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Financial Details</h4>
                 <p><strong>Source of Funds:</strong> {application.source_of_funds}</p>
                 <p><strong>Occupation Details:</strong> {application.occupation_details}</p>
                 <p><strong>Income Proof File:</strong> {renderFileLink(application.income_proof_file_path)}</p>


                 <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Selected Funds</h4>
                 {/* Use the safe parsing helper */}
                 {application.selected_funds && parseJsonArray(application.selected_funds).length > 0 ? (
                       <ul className="space-y-2">
                         {parseJsonArray(application.selected_funds).map((fund, index) => ( // Added index as key fallback
                           <li key={fund.id || index}> {/* Use fund.id if available, fallback to index */}
                             {fund.name}: ${fund.amount}
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <p>No funds selected.</p>
                     )}

                 <h4 className="text-lg font-medium text-gray-800 border-b pb-2 mt-4">Submission Info</h4>
                 <p><strong>Submission Date:</strong> {application.submission_date}</p>
                 <p><strong>Terms Accepted:</strong> {application.terms_accepted ? 'Yes' : 'No'}</p>
                 <p><strong>Current Status:</strong> <span className="font-semibold">{application.status.toUpperCase()}</span></p>
                  <p><strong>Assigned to Employee ID:</strong> {application.assigned_to_employee_id || 'Not Assigned'}</p>


            </div>

            {/* Admin Actions */}
            <div className="space-y-4 mt-6">
                <h4 className="text-lg font-semibold text-gray-800">Admin Actions</h4>

                {/* Assign Employee */}
                <div className="flex items-center space-x-2">
                    <label htmlFor="assign-employee" className="block text-sm font-medium text-gray-700">Assign to Employee:</label>
                    <select
                        id="assign-employee"
                        name="assign-employee"
                        value={assignedEmployee}
                        onChange={(e) => setAssignedEmployee(e.target.value)}
                        className="mt-1 block w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">-- Select Employee --</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleAssignEmployee}
                        disabled={!assignedEmployee}
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Assign
                    </button>
                </div>

                {/* Update Status */}
                 <div className="flex items-center space-x-2">
                    <label htmlFor="update-status" className="block text-sm font-medium text-gray-700">Update Status:</label>
                    <select
                        id="update-status"
                        name="update-status"
                        value={application.status} // Display current status
                        onChange={(e) => handleUpdateStatus(e.target.value)} // Call handler on change
                        className="mt-1 block w-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                         {/* Add other relevant statuses if needed */}
                    </select>
                 </div>


            </div>
        </div>
    );
}
