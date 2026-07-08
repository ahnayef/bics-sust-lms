export const copies = {
  title: "Copy Management",
  subtitle: "Manage individual book copies and generate QR codes.",
  stats: {
    total: "Total Copies",
    available: "Available",
    borrowed: "Borrowed",
    damaged: "Damaged",
  },
  sort: {
    titleAsc: "Title (A-Z)",
    titleDesc: "Title (Z-A)",
    copiesAsc: "Copies (Low to High)",
    copiesDesc: "Copies (High to Low)",
    createdAtAsc: "Created At (Oldest First)",
    createdAtDesc: "Created At (Newest First)",
  },
  filters: {
    searchPlaceholder: "Search Copy ID, title or author...",
    all: "All Status",
    available: "Available",
    borrowed: "Borrowed",
    damaged: "Damaged",
  },
  actions: {
    addCopy: "Add Copy",
    downloadQr: "Download QR",
    delete: "Delete",
    markAsDamaged: "Mark as Damaged",
    markAsAvailable: "Mark as Available",
  },
  table: {
    copyId: "Copy ID",
    bookTitle: "Book Title",
    status: "Status",
    createdAt: "Created At",
    actions: "Actions",
  },
  empty: "No copies match this search/filter combination.",
  modal: {
    addTitle: "Add New Copy",
    labels: {
      selectBook: "Select Book",
    },
    placeholders: {
      searchBook: "Search books by title or author...",
      selectBook: "Select a book from the list",
    },
    cancel: "Cancel",
    add: "Add Copy",
  },
  qrModal: {
    title: "QR Identity Card",
    download: "Download PNG",
    close: "Close",
    loading: "Generating card...",
    copyId: "Copy ID",
  },
  flash: {
    addSuccess: "New copy added successfully.",
    deleteSuccess: "Copy removed successfully.",
    statusUpdated: "Copy status updated successfully.",
  },
  confirmDelete: {
    title: "Remove Copy",
    message: "Are you sure you want to remove this copy? This action cannot be undone.",
    warning: "This copy is currently involved in {count} transactions. Removing it will cause data inconsistency.",
  },
} as const;
