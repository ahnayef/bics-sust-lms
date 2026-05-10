"use client";

import Link from "next/link";
import { signInWithGoogle } from "@/server/auth";

export default function Login() {
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
          box-shadow:
            inset 0 0 0 1px rgba(244, 235, 219, 0.55),
            0 0 0 1px rgba(69, 55, 43, 0.2),
            0 24px 40px rgba(49, 38, 29, 0.16);
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

        .google-btn {
          cursor: pointer;
          transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
        }

        .google-btn:hover {
          background-color: #e6d9c6 !important;
          box-shadow: 0 2px 8px rgba(49, 38, 29, 0.18);
        }

        .google-btn:active {
          transform: translateY(1px);
          box-shadow: 0 1px 3px rgba(49, 38, 29, 0.14);
        }
      `}</style>

      <div className="absolute inset-0 login-paper pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Wordmark */}
        <div
          className="text-center mb-7 sm:mb-8"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <Link href="/" className="inline-block">
            <span
              className="text-3xl sm:text-[2.05rem] font-bold text-[#221910]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              BICS SUST LMS
            </span>
          </Link>
          <p
            className="text-[#5c4f42] text-sm mt-2"
            style={{ fontFamily: "Courier Prime, monospace" }}
          >
            Library Management System
          </p>
        </div>

        {/* Card */}
        <div
          className="relative login-card tron-border bg-[#f1e7d8] p-6 sm:p-8 space-y-6"
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-delay="100"
        >
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
              Use your university Google account to continue
            </p>
          </div>

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="google-btn w-full flex items-center justify-center gap-3 border border-[#7b6d5f] bg-[#f8f1e6] text-[#221910] py-3 font-semibold"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
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
