'use client';

import Link from 'next/link';
import { FaArrowLeft, FaCheckCircle, FaClock, FaExclamationTriangle, FaSearch } from 'react-icons/fa';
import { useState, useMemo } from 'react';

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'active' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'status'>('date');

  // Mock data - will be replaced with actual API calls
  const [allHistory] = useState([
    {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      borrowedDate: '2025-04-01',
      dueDate: '2025-04-08',
      returnDate: '2025-04-08',
      status: 'completed',
    },
    {
      id: 2,
      title: '1984',
      author: 'George Orwell',
      borrowedDate: '2025-03-20',
      dueDate: '2025-03-27',
      returnDate: '2025-03-27',
      status: 'completed',
    },
    {
      id: 3,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      borrowedDate: '2025-04-05',
      dueDate: '2025-04-12',
      returnDate: null,
      status: 'active',
    },
    {
      id: 4,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      borrowedDate: '2025-03-10',
      dueDate: '2025-03-17',
      returnDate: '2025-03-20',
      status: 'completed',
    },
    {
      id: 5,
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      borrowedDate: '2025-02-28',
      dueDate: '2025-03-07',
      returnDate: '2025-03-10',
      status: 'completed',
    },
    {
      id: 6,
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      borrowedDate: '2025-02-15',
      dueDate: '2025-02-22',
      returnDate: null,
      status: 'overdue',
    },
    {
      id: 7,
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      borrowedDate: '2025-02-01',
      dueDate: '2025-02-08',
      returnDate: '2025-02-10',
      status: 'completed',
    },
    {
      id: 8,
      title: 'Wuthering Heights',
      author: 'Emily Brontë',
      borrowedDate: '2025-01-20',
      dueDate: '2025-01-27',
      returnDate: '2025-01-30',
      status: 'completed',
    },
  ]);

  // Filter and sort logic
  const filteredHistory = useMemo(() => {
    let filtered = allHistory.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.borrowedDate).getTime() - new Date(a.borrowedDate).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'status') {
        const statusOrder = { completed: 0, active: 1, overdue: 2 };
        return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      }
      return 0;
    });

    return filtered;
  }, [allHistory, searchTerm, statusFilter, sortBy]);

  // Calculate stats
  const stats = {
    total: allHistory.length,
    completed: allHistory.filter((item) => item.status === 'completed').length,
    active: allHistory.filter((item) => item.status === 'active').length,
    overdue: allHistory.filter((item) => item.status === 'overdue').length,
  };

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/profile"
              className="inline-flex items-center justify-center w-10 h-10 rounded hover:bg-gray-100 transition-colors"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-900" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Borrow History</h1>
              <p className="text-sm text-gray-600 mt-1">View all your book transactions</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600 mt-1">Total Transactions</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-600 mt-1">Completed</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-600 mt-1">Active</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              <p className="text-xs text-gray-600 mt-1">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Book title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="date">Borrow Date (Newest)</option>
                <option value="title">Title (A-Z)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Book</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Borrowed</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Due</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Returned</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        index === filteredHistory.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="py-3 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-600">{item.author}</p>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-gray-600 text-xs">
                        {new Date(item.borrowedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6 text-gray-600 text-xs">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-6 text-gray-600 text-xs">
                        {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-6">{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-2">No transactions found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-6 text-sm text-gray-600 text-center">
          Showing {filteredHistory.length} of {allHistory.length} transactions
        </div>
      </div>
    </div>
  );
}
