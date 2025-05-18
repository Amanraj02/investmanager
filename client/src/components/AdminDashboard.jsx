import React from 'react';

export default function AdminDashboard({ user }) {
  // Dummy data for client statistics
  const clientStats = {
    newClientsLastMonth: 15,
    totalClients: 150,
    pendingOnboarding: 8,
    completedOnboarding: 142
  };

  // Dummy data for client list
  const clientList = [
    { id: 1, name: 'John Smith', email: 'john.smith@email.com', stage: 'Pending Review', date: '2024-03-15' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah.j@email.com', stage: 'Rejected', date: '2024-03-14' },
    { id: 3, name: 'Michael Brown', email: 'm.brown@email.com', stage: 'Approved', date: '2024-03-13' },
    { id: 4, name: 'Emily Davis', email: 'emily.d@email.com', stage: 'Pending Review', date: '2024-03-12' },
    { id: 5, name: 'Robert Wilson', email: 'r.wilson@email.com', stage: 'Approved', date: '2024-03-11' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
      <p className="text-gray-700">Welcome, {user.username}!</p>

      {/* Client Statistics Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Client Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">New Clients (Last Month)</p>
            <p className="text-2xl font-bold text-blue-700">{clientStats.newClientsLastMonth}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Total Clients</p>
            <p className="text-2xl font-bold text-green-700">{clientStats.totalClients}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Pending Onboarding</p>
            <p className="text-2xl font-bold text-yellow-700">{clientStats.pendingOnboarding}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Completed Onboarding</p>
            <p className="text-2xl font-bold text-purple-700">{clientStats.completedOnboarding}</p>
          </div>
        </div>
      </div>

      {/* Client List Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Client Applications</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientList.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${client.stage === 'Approved' ? 'bg-green-100 text-green-800' : 
                        client.stage === 'Pending Review' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {client.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 