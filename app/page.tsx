'use client';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { FaBook, FaUsers, FaSync, FaChartBar, FaBell, FaLock } from 'react-icons/fa';

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
            Library Management
            <span className="block text-gray-700">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your book collection management with our modern, intuitive platform. 
            Track borrowing, returns, and member progress effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/login"
              className="bg-gray-900 text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 transition-colors"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="border-2 border-gray-900 text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-50 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to manage your library efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-4">
                <FaBook className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Book Management
              </h3>
              <p className="text-gray-600">
                Organize and track your entire book collection with ease. Manage multiple copies and maintain detailed records.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-4">
                <FaUsers className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Member Tracking
              </h3>
              <p className="text-gray-600">
                Monitor member progress, borrowing history, and completion status. Keep members informed with timely updates.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-4">
                <FaSync className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Borrow & Return
              </h3>
              <p className="text-gray-600">
                Simplified borrowing and return workflows. QR code scanning for quick operations and automatic approvals.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-4">
                <FaChartBar className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analytics & Reports
              </h3>
              <p className="text-gray-600">
                Get insights into borrowing patterns, member engagement, and collection usage with comprehensive reports.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-4">
                <FaBell className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Notifications
              </h3>
              <p className="text-gray-600">
                Automated reminders for due dates, overdue alerts, and return approvals. Keep everyone on track.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 border border-gray-200 rounded hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center mb-4">
                <FaLock className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Role-Based Access
              </h3>
              <p className="text-gray-600">
                Flexible permission system for admins, moderators, and members. Full control over who can do what.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Library?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join us today and experience the future of library management
          </p>
          <a
            href="/login"
            className="inline-block bg-white text-gray-900 px-8 py-3 rounded font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Now
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
