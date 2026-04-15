"use client";

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

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Courier+Prime:wght@400;700&display=swap');
        
        body {
          background-color: #e5d9c4;
          background-image: 
            linear-gradient(180deg, #eee4d3 0%, #e5d8c1 52%, #dcccb2 100%),
            linear-gradient(92deg, rgba(88, 66, 46, 0.05), transparent 24%),
            linear-gradient(268deg, rgba(88, 66, 46, 0.04), transparent 18%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(132deg, transparent, transparent 10px, rgba(0,0,0,.005) 10px, rgba(0,0,0,.005) 11px),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" seed="7"/></filter><rect width="260" height="260" fill="%23e5d9c4"/><rect width="260" height="260" filter="url(%23p)" opacity="0.028"/></svg>');
          background-size: 100% 100%;
        }
        
        .newspaper-grain {
          background-color: #e5d9c4;
          background-image: 
            linear-gradient(174deg, rgba(83, 62, 44, 0.045), transparent 25%),
            linear-gradient(6deg, rgba(83, 62, 44, 0.035), transparent 18%),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.008) 2px, rgba(0,0,0,.008) 4px);
          position: relative;
        }

        .newspaper-grain::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(180deg, rgba(58, 44, 32, 0.08), transparent 18%),
            linear-gradient(0deg, rgba(58, 44, 32, 0.06), transparent 16%),
            linear-gradient(90deg, rgba(58, 44, 32, 0.04), transparent 9%),
            linear-gradient(270deg, rgba(58, 44, 32, 0.035), transparent 8%),
            repeating-linear-gradient(152deg, transparent, transparent 18px, rgba(0,0,0,.008) 18px, rgba(0,0,0,.008) 19px);
          pointer-events: none;
        }
        
        .newspaper-grain::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" result="noise" seed="4" /></filter><rect width="140" height="140" fill="%23000" opacity="0.014" filter="url(%23noise)" /></svg>');
          pointer-events: none;
          mix-blend-mode: multiply;
        }

        .newspaper-headline {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          font-weight: 800;
          color: #1f1812;
          line-height: 1.2;
          letter-spacing: -1px;
          text-shadow: 0.6px 0.6px 0 rgba(48, 36, 26, 0.18), -0.4px 0 0 rgba(48, 36, 26, 0.08);
        }

        .newspaper-subheader {
          font-family: 'Courier Prime', monospace;
          font-size: 1rem;
          color: #4a3f35;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .newspaper-border {
          border: 1px solid #46372b;
          box-shadow: inset 0 0 0 1px rgba(244, 235, 219, 0.55), 0 0 0 1px rgba(69, 55, 43, 0.2);
        }

        .newspaper-divider {
          border-top: 2px double #1a1a1a;
          margin: 2rem 0;
        }

        .paper-wear {
          position: relative;
          overflow: hidden;
        }

        .paper-wear::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(180deg, rgba(70, 52, 38, 0.075), transparent 20%),
            linear-gradient(0deg, rgba(70, 52, 38, 0.065), transparent 16%),
            linear-gradient(90deg, rgba(70, 52, 38, 0.045), transparent 9%),
            repeating-linear-gradient(160deg, transparent, transparent 13px, rgba(0,0,0,.012) 13px, rgba(0,0,0,.012) 14px);
          mix-blend-mode: multiply;
          opacity: 0.28;
          pointer-events: none;
        }

        .feature-box {
          background-color: rgba(242, 234, 221, 0.85);
          border: 1px solid #6e604f;
          border-left: 2px solid #655848;
          box-shadow: inset 0 0 0 1px rgba(255, 247, 235, 0.42), 0 0 0 1px rgba(90, 72, 55, 0.09);
          position: relative;
          overflow: hidden;
          background-image:
            linear-gradient(178deg, rgba(95, 72, 52, 0.04), transparent 36%),
            repeating-linear-gradient(146deg, transparent, transparent 24px, rgba(0,0,0,.006) 24px, rgba(0,0,0,.006) 25px);
        }

        .feature-box::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.22) 0 2px, transparent 2px 20px) top / 100% 1px no-repeat,
            repeating-linear-gradient(90deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 18px) bottom / 100% 1px no-repeat,
            repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.18) 0 2px, transparent 2px 16px) left / 1px 100% no-repeat,
            repeating-linear-gradient(180deg, rgba(77, 59, 43, 0.14) 0 2px, transparent 2px 20px) right / 1px 100% no-repeat,
            linear-gradient(180deg, rgba(66, 50, 36, 0.05), transparent 24%, transparent 78%, rgba(66, 50, 36, 0.04));
          opacity: 0.8;
        }

        .feature-box::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            repeating-linear-gradient(145deg, transparent, transparent 22px, rgba(0,0,0,.008) 22px, rgba(0,0,0,.008) 23px),
            linear-gradient(180deg, rgba(0,0,0,.012), transparent 20%, transparent 82%, rgba(0,0,0,.012));
          opacity: 0.62;
          pointer-events: none;
        }
      `}</style>
      <Navbar />

      {/* Hero Section */}
      <section className="newspaper-grain pt-12 pb-12 px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-4xl mx-auto newspaper-border paper-wear p-8 sm:p-12"
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
              href="/login"
              className="newspaper-border px-8 py-3 font-semibold transition-colors text-center"
              style={{ backgroundColor: "#5a4d40", color: "#f5ecdf" }}
            >
              Get Started
            </a>
            <a
              href="#features"
              className="newspaper-border border-2 border-gray-900 text-gray-900 px-8 py-3 font-semibold transition-colors text-center"
              style={{ backgroundColor: "#f7f1e7" }}
            >
              Learn More
            </a>
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
            href="/login"
            className="inline-block px-8 py-3 font-semibold text-gray-900 hover:opacity-90 transition-opacity mt-6"
            style={{
              backgroundColor: "#c8b59f",
              border: "2px solid #8b7a67",
              color: "#3f352d",
              fontFamily: "Courier Prime, monospace",
            }}
          >
            Get Started Now
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
