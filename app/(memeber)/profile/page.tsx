'use client';

import Link from 'next/link';
import { FaBook, FaCheckCircle, FaClock, FaExclamationTriangle, FaArrowRight, FaQrcode, FaBookOpen } from 'react-icons/fa';
import { useState } from 'react';

export default function MemberProfile() {
  // Mock data - will be replaced with actual API calls
  const [member] = useState({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    joinedDate: '2025-01-15',
  });

  const [stats] = useState({
    totalBooks: 80,
    completed: 12,
    active: 3,
    history: [
      {
        id: 1,
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        borrowedDate: '2025-04-01',
        returnDate: '2025-04-08',
        status: 'completed',
      },
      {
        id: 2,
        title: '1984',
        author: 'George Orwell',
        borrowedDate: '2025-03-20',
        returnDate: '2025-03-27',
        status: 'completed',
      },
      {
        id: 3,
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        borrowedDate: '2025-04-05',
        dueDate: '2025-04-12',
        status: 'active',
      },
    ],
  });

  const remaining = stats.totalBooks - stats.completed;
  const completionPercentage = Math.round((stats.completed / stats.totalBooks) * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded">
            <FaCheckCircle className="w-3 h-3" />
            Completed
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded">
            <FaClock className="w-3 h-3" />
            Active
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded">
            <FaExclamationTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Borrow Button */}
      <Link
        href="/scan"
        className="fixed bottom-8 right-8 bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-all hover:shadow-xl z-40 flex items-center gap-2 group"
      >
        <FaQrcode className="w-5 h-5" />
        <span className="hidden group-hover:inline text-sm font-medium">Borrow Book</span>
      </Link>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{member.name}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {member.email} • Member since {new Date(member.joinedDate).toLocaleDateString()}
              </p>
            </div>
            <button className="px-6 py-2 bg-gray-900 text-white rounded font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Reading Journey</h2>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {stats.completed} of {stats.totalBooks} books completed
              </span>
              <span className="text-2xl font-bold text-gray-900">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-gray-900 to-gray-700 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Completed */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg text-center hover:shadow-sm transition-shadow">
              <FaCheckCircle className="w-5 h-5 text-gray-700 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-600 mt-1">Completed</p>
            </div>

            {/* Active */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg text-center hover:shadow-sm transition-shadow">
              <FaClock className="w-5 h-5 text-gray-700 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-600 mt-1">Active</p>
            </div>

            {/* Remaining */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg text-center hover:shadow-sm transition-shadow">
              <FaBook className="w-5 h-5 text-gray-700 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{remaining}</p>
              <p className="text-xs text-gray-600 mt-1">Remaining</p>
            </div>

            {/* Total */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg text-center hover:shadow-sm transition-shadow">
              <FaBookOpen className="w-5 h-5 text-gray-700 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
              <p className="text-xs text-gray-600 mt-1">Total Books</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Currently Borrowing - Featured */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaClock className="w-4 h-4 text-gray-700" />
                Currently Borrowing
              </h3>
              {stats.history.filter((item) => item.status === 'active').length > 0 ? (
                <div className="space-y-4">
                  {stats.history
                    .filter((item) => item.status === 'active')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{item.author}</p>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600">Due</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(item.dueDate!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaBook className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No active borrows</p>
                </div>
              )}
            </div>
          </div>

          {/* History Table - Main */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Borrow History</h3>
                <Link
                  href="/history"
                  className="text-sm text-gray-900 font-medium hover:underline flex items-center gap-1 group"
                >
                  View All
                  <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Book</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Borrowed</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Returned</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.history.slice(0, 5).map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                            <p className="text-xs text-gray-500">{item.author}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {new Date(item.borrowedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-xs">
                          {item.returnDate 
                            ? new Date(item.returnDate).toLocaleDateString() 
                            : item.dueDate 
                            ? new Date(item.dueDate).toLocaleDateString() 
                            : '-'}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
