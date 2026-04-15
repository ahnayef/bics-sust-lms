export type CopyStatus = "available" | "unavailable";

export interface LibraryCopy {
  id: string;
  copyNumber: string;
  status: CopyStatus;
  borrowedBy?: string;
  borrowedByName?: string;
  expectedAvailableDate?: string;
}

export interface LibraryBook {
  id: number;
  title: string;
  author: string;
  isSyllabus: boolean;
  pages: number;
  pdfLink?: string;
  copies: LibraryCopy[];
}

export interface LibraryCopyRecord extends LibraryCopy {
  title: string;
  author: string;
  pages: number;
  isSyllabus: boolean;
}

export const LIBRARY_BOOKS: LibraryBook[] = [
  {
    id: 1,
    title: "ইসলামের সামাজিক বিধান",
    author: "আল্লামা জামাল আল বাদাবী",
    isSyllabus: true,
    pages: 284,
    pdfLink: "https://example.com/pdfs/book-001.pdf",
    copies: [
      {
        id: "QR001",
        copyNumber: "Copy 1",
        status: "available",
      },
      {
        id: "QR013",
        copyNumber: "Copy 2",
        status: "unavailable",
        borrowedBy: "Member-204",
        borrowedByName: "Mahmudul Hasan",
        expectedAvailableDate: "2026-04-20",
      },
    ],
  },
  {
    id: 2,
    title: "পর্দা ও ইসলাম",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    isSyllabus: true,
    pages: 156,
    pdfLink: "https://example.com/pdfs/book-002.pdf",
    copies: [
      {
        id: "QR002",
        copyNumber: "Copy 1",
        status: "available",
      },
      {
        id: "QR014",
        copyNumber: "Copy 2",
        status: "available",
      },
    ],
  },
  {
    id: 3,
    title: "আদাবে জিন্দেগী",
    author: "আল্লামা ইউসুফ ইসলাহী",
    isSyllabus: true,
    pages: 320,
    pdfLink: "https://example.com/pdfs/book-003.pdf",
    copies: [
      {
        id: "QR003",
        copyNumber: "Copy 1",
        status: "available",
      },
    ],
  },
  {
    id: 4,
    title: "ইসলামী ব্যাংকিং ও অর্থায়ন পদ্ধতি: সমস্যা ও সমাধান",
    author: "মুফতি তাকি উসমানি",
    isSyllabus: true,
    pages: 448,
    pdfLink: "https://example.com/pdfs/book-004.pdf",
    copies: [
      {
        id: "QR004",
        copyNumber: "Copy 1",
        status: "unavailable",
        borrowedBy: "Member-204",
        borrowedByName: "Mahmudul Hasan",
        expectedAvailableDate: "2026-04-20",
      },
    ],
  },
  {
    id: 5,
    title: "ইসলামী অর্থনীতি",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    isSyllabus: true,
    pages: 256,
    pdfLink: "https://example.com/pdfs/book-005.pdf",
    copies: [
      {
        id: "QR005",
        copyNumber: "Copy 1",
        status: "unavailable",
        borrowedBy: "Member-311",
        borrowedByName: "Nabil Islam",
        expectedAvailableDate: "2026-04-22",
      },
      {
        id: "QR015",
        copyNumber: "Copy 2",
        status: "available",
      },
    ],
  },
  {
    id: 6,
    title: "ইসলামী অর্থ ব্যবস্থায় যাকাত",
    author: "ড. জাবের মোহাম্মদ (ইসলামিক সেন্টার)",
    isSyllabus: true,
    pages: 192,
    pdfLink: "https://example.com/pdfs/book-006.pdf",
    copies: [
      {
        id: "QR006",
        copyNumber: "Copy 1",
        status: "available",
      },
    ],
  },
  {
    id: 7,
    title: "খেলাফত ও রাজতন্ত্র",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    isSyllabus: false,
    pages: 224,
    pdfLink: "https://example.com/pdfs/book-007.pdf",
    copies: [
      {
        id: "QR007",
        copyNumber: "Copy 1",
        status: "unavailable",
        borrowedBy: "Member-110",
        borrowedByName: "Sabbir Ahmed",
        expectedAvailableDate: "2026-04-24",
      },
    ],
  },
  {
    id: 8,
    title: "ইসলামী রাষ্ট্রে অমুসলিমদের অধিকার",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    isSyllabus: false,
    pages: 176,
    pdfLink: "https://example.com/pdfs/book-008.pdf",
    copies: [
      {
        id: "QR008",
        copyNumber: "Copy 1",
        status: "available",
      },
    ],
  },
  {
    id: 9,
    title: "একটি সত্যনিষ্ঠ দলের প্রয়োজন",
    author: "সাইয়েদ আবুল আ’লা মওদূদী",
    isSyllabus: false,
    pages: 128,
    pdfLink: "https://example.com/pdfs/book-009.pdf",
    copies: [
      {
        id: "QR009",
        copyNumber: "Copy 1",
        status: "available",
      },
    ],
  },
  {
    id: 10,
    title: "ইসলামী রাষ্ট্রব্যবস্থা : তত্ত্ব ও প্রয়োগ",
    author: "ড. ইউসুফ আল-কারযাভী",
    isSyllabus: false,
    pages: 352,
    pdfLink: "https://example.com/pdfs/book-010.pdf",
    copies: [
      {
        id: "QR010",
        copyNumber: "Copy 1",
        status: "unavailable",
        borrowedBy: "Member-087",
        borrowedByName: "Mehedi Hasan",
        expectedAvailableDate: "2026-04-25",
      },
    ],
  },
  {
    id: 11,
    title: "ইসলামী রাষ্ট্র ও সংবিধান",
    author: "উল্লেখ নেই",
    isSyllabus: false,
    pages: 240,
    pdfLink: "https://example.com/pdfs/book-011.pdf",
    copies: [
      {
        id: "QR011",
        copyNumber: "Copy 1",
        status: "available",
      },
    ],
  },
  {
    id: 12,
    title: "গণতন্ত্র: ইসলামী দৃষ্টিকোণ",
    author: "ড. আহমদ আলী",
    isSyllabus: false,
    pages: 168,
    pdfLink: "https://example.com/pdfs/book-012.pdf",
    copies: [
      {
        id: "QR012",
        copyNumber: "Copy 1",
        status: "available",
      },
    ],
  },
];

export const LIBRARY_COPIES_BY_ID: Record<string, LibraryCopyRecord> =
  LIBRARY_BOOKS.reduce<Record<string, LibraryCopyRecord>>(
    (accumulator, book) => {
      book.copies.forEach((copy) => {
        accumulator[copy.id] = {
          id: copy.id,
          copyNumber: copy.copyNumber,
          status: copy.status,
          borrowedBy: copy.borrowedBy,
          borrowedByName: copy.borrowedByName,
          expectedAvailableDate: copy.expectedAvailableDate,
          title: book.title,
          author: book.author,
          pages: book.pages,
          isSyllabus: book.isSyllabus,
        };
      });

      return accumulator;
    },
    {},
  );
