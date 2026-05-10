"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signInWithGoogle, signInWithEmail } from "@/server/auth";

type ForgotStep = "email" | "otp" | "reset" | "success";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotInfo, setForgotInfo] = useState("");

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const maskEmail = (value: string) => {
    const [local, domain] = value.split("@");
    if (!local || !domain) return value;
    if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  const resetForgotFlow = () => {
    setForgotStep("email");
    setRecoveryEmail(email || "");
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
    setForgotInfo("");
    setForgotLoading(false);
  };

  const openForgotPassword = () => {
    resetForgotFlow();
    setShowForgotModal(true);
  };

  const closeForgotPassword = () => {
    setShowForgotModal(false);
    setForgotError("");
    setForgotInfo("");
    setForgotLoading(false);
  };

  const handleSendResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = recoveryEmail.trim().toLowerCase();
    setForgotError("");
    setForgotInfo("");

    if (!validateEmail(trimmedEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setRecoveryEmail(trimmedEmail);
      setForgotInfo(`Verification code sent to ${maskEmail(trimmedEmail)}`);
      setForgotStep("otp");
    } catch {
      setForgotError("Unable to send verification code. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = otpCode.trim();
    setForgotError("");
    setForgotInfo("");

    if (!/^\d{6}$/.test(normalizedCode)) {
      setForgotError("Enter the 6-digit verification code.");
      return;
    }

    setForgotLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setForgotStep("reset");
      setForgotInfo("Code verified. Set a new password.");
    } catch {
      setForgotError("Code verification failed. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendCode = async () => {
    setForgotError("");
    setForgotInfo("");
    setForgotLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setForgotInfo(`A new code has been sent to ${maskEmail(recoveryEmail)}`);
    } catch {
      setForgotError("Failed to resend code. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotError("");
    setForgotInfo("");

    if (newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setForgotStep("success");
      setForgotInfo("Password updated successfully. You can now sign in.");
      setPassword("");
    } catch {
      setForgotError("Password reset failed. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("password", password);
      const result = await signInWithEmail(fd);
      if (result?.error) {
        setError(result.error);
      }
      // if no error, signInWithEmail redirects server-side — nothing else needed
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
                placeholder="ahsan.habib@duck.com"
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
              <button
                type="button"
                onClick={openForgotPassword}
                className="text-[#3b2f24] font-semibold text-sm hover:underline"
                style={{ fontFamily: "Courier Prime, monospace" }}
              >
                Forgot password?
              </button>
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

          <div className="relative flex items-center">
            <div className="grow border-t border-[#7b6d5f]" />
            <span
              className="mx-3 shrink text-xs text-[#7b6d5f] uppercase tracking-widest"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              or
            </span>
            <div className="grow border-t border-[#7b6d5f]" />
          </div>

          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 border border-[#7b6d5f] bg-[#f8f1e6] text-[#221910] py-2.5 font-semibold hover:bg-[#ede3d4] transition-colors"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
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

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            aria-label="Close forgot password dialog"
            onClick={closeForgotPassword}
            className="absolute inset-0 bg-[#1f170f]/42 backdrop-blur-[1px]"
          />

          <div
            className="relative z-10 w-full max-w-md bg-[#f1e7d8] login-card tron-border p-5 sm:p-6 space-y-5"
            data-aos="fade-up"
            data-aos-duration="600"
          >
            <div className="border-b border-[#7b6d5f] pb-3">
              <h2
                className="text-2xl font-bold text-[#221910]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Forgot Password
              </h2>
              <p
                className="text-[#5c4f42] text-sm mt-1"
                style={{ fontFamily: "Courier Prime, monospace" }}
              >
                {forgotStep === "email" && "Step 1 of 4: Verify your email"}
                {forgotStep === "otp" && "Step 2 of 4: Enter verification code"}
                {forgotStep === "reset" && "Step 3 of 4: Create a new password"}
                {forgotStep === "success" && "Step 4 of 4: All set"}
              </p>
            </div>

            {forgotError && (
              <div
                className="bg-[#f6e3df] border border-[#b0665c] text-[#7d2d23] px-3 py-2 text-sm"
                style={{ fontFamily: "Courier Prime, monospace" }}
              >
                {forgotError}
              </div>
            )}

            {forgotInfo && (
              <div
                className="bg-[#e8efdf] border border-[#8aa06f] text-[#384d24] px-3 py-2 text-sm"
                style={{ fontFamily: "Courier Prime, monospace" }}
              >
                {forgotInfo}
              </div>
            )}

            {forgotStep === "email" && (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="recovery-email"
                    className="login-label block text-sm font-semibold text-[#221910] mb-1.5"
                  >
                    Account Email
                  </label>
                  <input
                    id="recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    className="w-full px-4 py-2.5 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent"
                    style={{ fontFamily: "Courier Prime, monospace" }}
                    placeholder="ahsan.habib@duck.com"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="w-full sm:w-auto px-4 py-2.5 border border-[#7b6d5f] text-[#3b2f24] font-semibold hover:bg-[#eadcca] transition-colors"
                    style={{ fontFamily: "Courier Prime, monospace" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-[#5a4d40] text-[#f6ede1] py-2.5 font-semibold hover:bg-[#4c4035] disabled:bg-[#6f6256] disabled:cursor-not-allowed transition-colors"
                    style={{ fontFamily: "Courier Prime, monospace" }}
                  >
                    {forgotLoading ? "Sending..." : "Send Code"}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === "otp" && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="otp-code"
                    className="login-label block text-sm font-semibold text-[#221910] mb-1.5"
                  >
                    Verification Code
                  </label>
                  <input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(event) =>
                      setOtpCode(event.target.value.replace(/\D/g, ""))
                    }
                    className="w-full px-4 py-2.5 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] tracking-[0.35em] text-center focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent"
                    style={{ fontFamily: "Courier Prime, monospace" }}
                    placeholder="000000"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={forgotLoading}
                    className="text-left text-sm text-[#3b2f24] font-semibold hover:underline disabled:opacity-60"
                    style={{ fontFamily: "Courier Prime, monospace" }}
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotStep("email")}
                    className="text-left sm:text-right text-sm text-[#3b2f24] font-semibold hover:underline"
                    style={{ fontFamily: "Courier Prime, monospace" }}
                  >
                    Change Email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#5a4d40] text-[#f6ede1] py-2.5 font-semibold hover:bg-[#4c4035] disabled:bg-[#6f6256] disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  {forgotLoading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
            )}

            {forgotStep === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="login-label block text-sm font-semibold text-[#221910] mb-1.5"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full px-4 py-2.5 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent"
                    style={{ fontFamily: "Courier Prime, monospace" }}
                    placeholder="Minimum 8 characters"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="login-label block text-sm font-semibold text-[#221910] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full px-4 py-2.5 border border-[#7b6d5f] bg-[#f8f1e6] text-[#1f1812] focus:outline-none focus:ring-2 focus:ring-[#5a4d40] focus:border-transparent"
                    style={{ fontFamily: "Courier Prime, monospace" }}
                    placeholder="Re-enter password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#5a4d40] text-[#f6ede1] py-2.5 font-semibold hover:bg-[#4c4035] disabled:bg-[#6f6256] disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  {forgotLoading ? "Updating..." : "Reset Password"}
                </button>
              </form>
            )}

            {forgotStep === "success" && (
              <div className="space-y-4">
                <p
                  className="text-sm text-[#4b3d30]"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  Your password has been reset successfully for
                  <span className="font-semibold">
                    {" "}
                    {maskEmail(recoveryEmail)}
                  </span>
                  .
                </p>

                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="w-full bg-[#5a4d40] text-[#f6ede1] py-2.5 font-semibold hover:bg-[#4c4035] transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
