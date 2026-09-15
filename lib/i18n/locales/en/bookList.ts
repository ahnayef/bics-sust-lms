export const bookList = {
  header: {
    title: "Library Catalog",
    subtitle: "Browse and discover books in our collection.",
    searchPlaceholder: "Search by title, author, or keywords...",
    filters: "Filters",
    sortBy: "Sort By",
  },
  filters: {
    type: {
      all: "All Types",
      syllabus: "Syllabus",
      additional: "Additional",
    },
    availability: {
      all: "All Availability",
      available: "Available Now",
      unavailable: "Currently Out",
    },
  },
  sorting: {
    title: "Title (A-Z)",
    pagesAsc: "Pages (Shortest)",
    pagesDesc: "Pages (Longest)",
    copiesAsc: "Copies (Fewest)",
    copiesDesc: "Copies (Most)",
  },
  table: {
    book: "Book",
    author: "Author",
    pages: "Pages",
    type: "Type",
    copies: "Copies",
    available: "Open",
    pdf: "PDF",
    copyId: "Copy ID",
    copyNum: "Copy #",
    status: "Status",
    actions: "Action",
  },
  bookCard: {
    pages: "pages",
    copies: "copies total",
    syllabus: "Syllabus",
    additional: "Additional",
    viewCopies: "View Copies",
    hideCopies: "Hide Copies",
    pdfReport: "Mark as Read",
    readPdf: "Read PDF",
    pdfStatus: {
      pending: "PDF Pending",
      approved: "PDF Approved",
      rejected: "PDF Rejected",
    },
  },
  copyStatus: {
    available: "Available",
    damaged: "Damaged",
    borrowed: "Borrowed",
    alreadyBorrowed: "You already have this book",
  },
  pdfModal: {
    title: "Mark as Read",
    description: "Your PDF read submission is pending moderator approval.",
    submitted: "Submitted!",
    dateLabel: "Date Read *",
    noteLabel: "Notes / Summary (Optional)",
    notePlaceholder: "What did you learn from this book?",
    submit: "Submit Report",
    submitting: "Submitting...",
    bookLabel: "Book",
    errors: {
      alreadySubmitted:
        "You already have a pending or approved submission for this book.",
      generic: "Something went wrong. Please try again.",
    },
  },
  empty: {
    noBooks: "No books match the current filters.",
    clearFilters: "Clear Filters",
  },
  qrPrint: {
    title: "Print QR Codes",
    subtitle: "Moderator Tools",
    tabs: {
      select: "Select Items",
      preview: "Preview & Print Layout",
    },
    filters: {
      allAuthors: "All Authors",
      booksShown: "{count} books shown",
    },
    table: {
      sel: "Sel",
      selectUnselectAll: "Select / Unselect All Filtered",
    },
    preview: {
      options: "Print Options",
      duplicates: "Duplicates per QR",
      fillPage: "Fill page (experimental)",
      fillPageNote: "Repeats selected items to fill an A4 grid",
      print: "Print Now",
      printNote:
        "Use 'Save as PDF' or 'Print' in the browser dialog. Best printed on A4 paper.",
    },
  },
} as const;
