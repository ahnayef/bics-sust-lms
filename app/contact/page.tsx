







































































































































































































































































import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { FaEnvelope, FaClock, FaQuestionCircle } from "react-icons/fa";

export default function ContactPage() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#e8dcc8]">
      <Navbar />

      <main className="newspaper-grain pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div
            className="text-center mb-12 pb-6 border-b-2 border-double border-gray-900"
            data-aos="fade-up"
            data-aos-duration="300"
          >
            <h1 className="newspaper-headline mb-2">Contact Us</h1>
            <p className="newspaper-subheader uppercase tracking-widest">
              Get in touch with the library team
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Contact Card */}
            <div
              className="newspaper-border paper-wear p-8 sm:p-10 relative overflow-hidden"
              style={{ backgroundColor: "#f1e8d9" }}
              data-aos="fade-up"
              data-aos-duration="300"
            >
              <div className="relative z-10">
                <h2
                  className="text-2xl font-bold text-gray-900 mb-6"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  Direct Communication
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-sm flex items-center justify-center shrink-0 mt-1">
                      <FaEnvelope className="text-yellow-100 text-lg" />
                    </div>
                    <div>
                      <h3
                        className="font-bold text-gray-900 mb-1"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Email Support
                      </h3>
                      <p
                        className="text-gray-800 mb-2"
                        style={{ fontFamily: "Courier Prime, monospace" }}
                      >
                        For general inquiries, account issues, or book requests.
                      </p>
                      <a
                        href="mailto:sust-lms@gmail.com"
                        className="text-xl font-bold text-[#5a4d40] hover:underline transition-all"
                        style={{ fontFamily: "Courier Prime, monospace" }}
                      >
                        sust-lms@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-sm flex items-center justify-center shrink-0 mt-1">
                      <FaClock className="text-yellow-100 text-lg" />
                    </div>
                    <div>
                      <h3
                        className="font-bold text-gray-900 mb-1"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Response Time
                      </h3>
                      <p
                        className="text-gray-800"
                        style={{ fontFamily: "Courier Prime, monospace" }}
                      >
                        We typically respond within 24-48 hours during business days.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-gray-400">
                    <div className="w-10 h-10 bg-gray-900 rounded-sm flex items-center justify-center shrink-0 mt-1">
                      <FaQuestionCircle className="text-yellow-100 text-lg" />
                    </div>
                    <div>
                      <h3
                        className="font-bold text-gray-900 mb-1"
                        style={{ fontFamily: "Playfair Display, serif" }}
                      >
                        Need immediate help?
                      </h3>
                      <p
                        className="text-gray-800"
                        style={{ fontFamily: "Courier Prime, monospace" }}
                      >
                        Check the FAQ section in the footer for common questions about borrowing and returning books.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Stamp */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 border-4 border-gray-900/10 rounded-full flex items-center justify-center rotate-12 pointer-events-none select-none">
                <span className="text-gray-900/10 font-bold text-sm text-center uppercase tracking-widest leading-tight">
                  Official<br />Correspondence
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div
              className="text-center italic text-gray-700 max-w-xl mx-auto"
              style={{ fontFamily: "Courier Prime, monospace", fontSize: "0.9rem" }}
              data-aos="fade-up"
              data-aos-duration="300"
              data-aos-delay="100"
            >
              "Books are the quietest and most constant of friends; they are the most accessible and wisest of counselors, and the most patient of teachers." — Charles W. Eliot
            </div>
          </div>
        </div>
      </main>

      <Footer year={year} />
    </div>
  );
}
