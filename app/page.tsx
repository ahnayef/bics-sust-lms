import {
  FaBell,
  FaBook,
  FaChartBar,
  FaLock,
  FaSync,
  FaUsers,
} from "react-icons/fa";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import "../styles/grain.css";
import { getClaims } from "@/server/user";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const claims = await getClaims();
  const isLoggedIn = !!claims;
  const ctaHref = isLoggedIn ? "/dashboard" : "/login";
  const ctaLabel = isLoggedIn ? "Go to Dashboard" : "Get Started";
  const year = new Date().getFullYear();

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="newspaper-grain pt-12 pb-12 px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-4xl mx-auto newspaper-border paper-wear p-8 sm:p-12 mt-10"
          style={{ backgroundColor: "#f1e8d9" }}
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <div className="text-center border-b-2 border-double border-gray-800 pb-6 mb-6">
            <div className="newspaper-subheader mb-4">
              BICS SUST Digital Library Platform
            </div>
            <h1 className="newspaper-headline">
              Library Management
              <div style={{ fontSize: "2.5rem", marginTop: "0.5rem" }}>
                Made Simple
              </div>
            </h1>
            <div className="newspaper-subheader mt-4">
              One workflow from shelf to checkout
            </div>
          </div>

          <p
            className="text-lg text-gray-900 mb-8 max-w-2xl mx-auto text-center"
            style={{
              fontFamily: "Courier Prime, monospace",
              lineHeight: "1.8",
            }}
          >
            Manage books, copies, and members in one place. Handle borrowing and
            returns with clear workflows, and track member reading progress
            across syllabus and general collections.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={ctaHref}
              className="newspaper-border px-8 py-3 font-semibold transition-colors text-center"
              style={{ backgroundColor: "#5a4d40", color: "#f5ecdf" }}
            >
              {ctaLabel}
            </a>
            {!isLoggedIn && (
              <a
                href="#features"
                className="newspaper-border border-2 border-gray-900 text-gray-900 px-8 py-3 font-semibold transition-colors text-center"
                style={{ backgroundColor: "#f7f1e7" }}
              >
                Learn More
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="newspaper-grain py-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div
            className="text-center mb-12 pb-6 border-b-2 border-double border-gray-900"
            data-aos="fade-up"
            data-aos-duration="800"
          >
            <h2 className="newspaper-headline mb-2">Powerful Features</h2>
            <p className="newspaper-subheader">
              Everything needed to run your campus library operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div
              className="feature-box p-6"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="0"
            >
              <div className="w-12 h-12 bg-gray-900 rounded-sm flex items-center justify-center mb-4">
                <FaBook className="text-yellow-100 text-xl" />
              </div>
              <h3
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Book Management
              </h3>
              <p
                className="text-gray-800"
                style={{
                  fontFamily: "Courier Prime, monospace",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                Organize titles and copy inventory with complete records. Keep
                collection data structured for daily operations and audits.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="feature-box p-6"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="100"
            >
              <div className="w-12 h-12 bg-gray-900 rounded-sm flex items-center justify-center mb-4">
                <FaUsers className="text-yellow-100 text-xl" />
              </div>
              <h3
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Member Tracking
              </h3>
              <p
                className="text-gray-800"
                style={{
                  fontFamily: "Courier Prime, monospace",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                Track member borrowing history, reading activity, and syllabus
                completion so progress is visible at a glance.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="feature-box p-6"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="200"
            >
              <div className="w-12 h-12 bg-gray-900 rounded-sm flex items-center justify-center mb-4">
                <FaSync className="text-yellow-100 text-xl" />
              </div>
              <h3
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Borrow & Return
              </h3>
              <p
                className="text-gray-800"
                style={{
                  fontFamily: "Courier Prime, monospace",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                Process borrow and return requests with clear status updates and
                QR-based handling for faster desk operations.
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className="feature-box p-6"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="0"
            >
              <div className="w-12 h-12 bg-gray-900 rounded-sm flex items-center justify-center mb-4">
                <FaChartBar className="text-yellow-100 text-xl" />
              </div>
              <h3
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Analytics & Reports
              </h3>
              <p
                className="text-gray-800"
                style={{
                  fontFamily: "Courier Prime, monospace",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                Monitor borrowing trends, overdue items, and collection usage to
                support better library planning and follow-up.
              </p>
            </div>

            {/* Feature 5 */}
            <div
              className="feature-box p-6"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="100"
            >
              <div className="w-12 h-12 bg-gray-900 rounded-sm flex items-center justify-center mb-4">
                <FaBell className="text-yellow-100 text-xl" />
              </div>
              <h3
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Smart Notifications
              </h3>
              <p
                className="text-gray-800"
                style={{
                  fontFamily: "Courier Prime, monospace",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                Keep users informed with due-date reminders and overdue alerts
                so books move on time and queues stay organized.
              </p>
            </div>

            {/* Feature 6 */}
            <div
              className="feature-box p-6"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="200"
            >
              <div className="w-12 h-12 bg-gray-900 rounded-sm flex items-center justify-center mb-4">
                <FaLock className="text-yellow-100 text-xl" />
              </div>
              <h3
                className="text-lg font-semibold text-gray-900 mb-2"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Role-Based Access
              </h3>
              <p
                className="text-gray-800"
                style={{
                  fontFamily: "Courier Prime, monospace",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                Grant the right access level to admins, moderators, and members
                with clear permission boundaries for each role.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="contact"
        className="py-16 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: "#cdbba4",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px)",
        }}
      >
        <div
          className="max-w-4xl mx-auto text-center newspaper-border paper-wear p-8 sm:p-12"
          style={{ backgroundColor: "#efe4d2", borderColor: "#6d6053" }}
          data-aos="fade-up"
          data-aos-duration="800"
        >
          <h2
            className="text-4xl font-semibold mb-6"
            style={{ fontFamily: "Playfair Display, serif", color: "#3f352d" }}
          >
            Ready to Transform Your Library?
          </h2>
          <div
            style={{
              borderTop: "1px solid #8b7a67",
              borderBottom: "1px solid #8b7a67",
              padding: "1rem 0",
              margin: "1.5rem 0",
            }}
          >
            <p
              className="text-xl font-semibold"
              style={{
                fontFamily: "Courier Prime, monospace",
                color: "#5b4f44",
                letterSpacing: "1px",
              }}
            >
              Launch your library workflow with one connected LMS
            </p>
          </div>
          <a
            href={ctaHref}
            className="inline-block px-8 py-3 font-semibold text-gray-900 hover:opacity-90 transition-opacity mt-6"
            style={{
              backgroundColor: "#c8b59f",
              border: "2px solid #8b7a67",
              color: "#3f352d",
              fontFamily: "Courier Prime, monospace",
            }}
          >
            {ctaLabel}
          </a>
        </div>
      </section>

      <Footer year={year} />
    </>
  );
}

function HomeFallback() {
  return (
    <>
      <Navbar isLoggedIn={false} />
      <div
        className="newspaper-grain flex min-h-[50vh] items-center justify-center px-4 pt-12"
        aria-busy
        aria-label="Loading"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
      <Footer />
    </>
  );
}
