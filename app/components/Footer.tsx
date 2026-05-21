"use client";

import { useTranslation } from "@/lib/i18n/context";
import Link from "next/link";

/** Pass `year` from a dynamic parent (after `cookies` / auth) so prerender avoids raw `Date()`. */
export default function Footer({ year }: { year?: number }) {
  const currentYear = year ?? 2026;
  const { t } = useTranslation();

  return (
    <footer
      className="text-[#1f1a17] border-t-2 border-[#3c342d]"
      style={{
        backgroundColor: "#e8dcc8",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.01) 2px, rgba(0,0,0,.01) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,.01) 2px, rgba(0,0,0,.01) 4px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <Link href="/">
              <h3
                className="font-bold text-2xl mb-4 hover:text-[#2f2924] transition-colors"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                SUST LMS
              </h3>
            </Link>
            <p
              className="text-sm leading-relaxed text-[#5a4d40]"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              {t.footer.about}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className="font-semibold mb-4 tracking-wide"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              {t.footer.links}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  {t.nav.features}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  {t.nav.contact}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  {t.nav.signIn}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="font-semibold mb-4 tracking-wide"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#"
                  className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
                  style={{ fontFamily: "Courier Prime, monospace" }}
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="font-semibold mb-4 tracking-wide"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Contact
            </h4>
            <ul
              className="space-y-2 text-sm text-[#5a4d40]"
              style={{ fontFamily: "Courier Prime, monospace" }}
            >
              <li>Email: info@sustlms.com</li>
              <li>Phone: +1 (555) 000-0000</li>
              <li>
                <Link
                  href="#"
                  className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
                >
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#3c342d]"></div>

        {/* Bottom Section */}
        <div
          className="mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-[#5a4d40] gap-3"
          style={{ fontFamily: "Courier Prime, monospace" }}
        >
          <p>&copy; {currentYear} SUST LMS. {t.footer.rights}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              href="#"
              className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-[#4e4237] hover:text-[#2f2924] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
