import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SUST LMS",
  description: "BICS SUST Library Management System",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
