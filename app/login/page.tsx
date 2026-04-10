"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // API call will be implemented in Phase 1
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Login failed. Please try again.");
        return;
      }

      // Redirect to role-based dashboard after successful login
      const data = await response.json();
      const role = data.user?.role || "member";

      if (role === "admin" || role === "moderator") {
        window.location.href = "/dashboard/";
      } else {
        window.location.href = "/profile";
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-gray-900">SUST LMS</span>
          </Link>
          <p className="text-gray-600 text-sm mt-2">
            Library Management System
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-gray-200 p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
            <p className="text-gray-600 text-sm mt-1">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="#"
                className="text-gray-900 font-medium text-sm hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-2 rounded font-semibold hover:bg-gray-800 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center text-sm text-gray-600">
            <p>
              Need help?{" "}
              <Link
                href="#"
                className="text-gray-900 font-medium hover:underline"
              >
                Contact Support
              </Link>
            </p>
            <p className="mt-2">
              <Link
                href="/"
                className="text-gray-900 font-medium hover:underline"
              >
                Back to Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
