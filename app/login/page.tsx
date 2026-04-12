"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex items-center justify-center bg-[#e5d9c4] relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');

        .login-paper {
          background-image:
            linear-gradient(180deg, #eee4d3 0%, #e5d8c1 52%, #dcccb2 100%),
            linear-gradient(92deg, rgba(88, 66, 46, 0.05), transparent 24%),
            linear-gradient(268deg, rgba(88, 66, 46, 0.04), transparent 18%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" seed="6"/></filter><rect width="220" height="220" fill="%23e5d9c4"/><rect width="220" height="220" filter="url(%23p)" opacity="0.028"/></svg>');
        }

        .login-card {
          border: 1px solid #46372b;
          box-shadow: inset 0 0 0 1px rgba(244, 235, 219, 0.55), 0 0 0 1px rgba(69, 55, 43, 0.2), 0 24px 40px rgba(49, 38, 29, 0.16);
        }

        .tron-border {
          position: relative;
        }

        .tron-border::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.28) 0 4px, transparent 4px 22px) top / 100% 1px no-repeat,
            repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.22) 0 3px, transparent 3px 18px) bottom / 100% 1px no-repeat,
            repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.24) 0 3px, transparent 3px 16px) left / 1px 100% no-repeat,
            repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 20px) right / 1px 100% no-repeat;
          opacity: 0.82;
          mix-blend-mode: multiply;
        }

        .login-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(180deg, rgba(58, 44, 32, 0.07), transparent 18%),
            linear-gradient(0deg, rgba(58, 44, 32, 0.05), transparent 14%),
            repeating-linear-gradient(152deg, transparent, transparent 18px, rgba(0,0,0,.008) 18px, rgba(0,0,0,.008) 19px);
          pointer-events: none;
        }

        .login-label {
          font-family: 'Courier Prime', monospace;
          letter-spacing: 0.3px;
        }
      `}</style>

      <div className="absolute inset-0 login-paper pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-7 sm:mb-8">
          <Link href="/" className="inline-block">
            <span
              className="text-3xl sm:text-[2.05rem] font-bold text-[#221910]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              SUST LMS
            </span>
          </Link>
          <p
            className="text-[#5c4f42] text-sm mt-2"
            style={{ fontFamily: "Courier Prime, monospace" }}
          >
            Library Management System
          </p>
        </div>

        <div className="relative login-card tron-border bg-[#f1e7d8] p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#7b6d5f] pb-4">
            <h1
              className="text-3xl font-bold text-[#221910]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Sign In
            </h1>
            <p
              className="text-[#5c4f42] text-sm mt-1"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div
              className="bg-[#f6e3df] border border-[#b0665c] text-[#7d2d23] px-4 py-3 text-sm"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="login-label block text-sm font-semibold text-[#221910] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent"
                style={{ fontFamily: "Courier Prime, monospace" }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="login-label block text-sm font-semibold text-[#221910] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent"
                style={{ fontFamily: "Courier Prime, monospace" }}
                placeholder="••••••••"
              />
            </div>

            <div className="text-right">
              <Link
                href="#"
                className="text-[#3b2f24] font-semibold text-sm hover:underline"
                style={{ fontFamily: "Courier Prime, monospace" }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#5a4d40] text-[#f6ede1] py-2.5 font-semibold hover:bg-[#4c4035] disabled:bg-[#6f6256] disabled:cursor-not-allowed transition-colors"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div
            className="border-t border-[#7b6d5f] pt-4 text-center text-sm text-[#5c4f42]"
            style={{ fontFamily: "Courier Prime, monospace" }}
          >
            <p>
              Need help?{" "}
              <Link
                href="#"
                className="text-[#3b2f24] font-semibold hover:underline"
              >
                Contact Support
              </Link>
            </p>
            <p className="mt-2">
              <Link
                href="/"
                className="text-[#3b2f24] font-semibold hover:underline"
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
