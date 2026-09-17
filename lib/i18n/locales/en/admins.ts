export const admins = {
  title: "Admins",
  subtitle: "Administrator accounts with elevated access.",
  actions: {
    add: "Add Admin",
    remove: "Remove",
  },
  filters: {
    searchPlaceholder: "Search by name or email...",
  },
  empty: "No results found.",
  roles: {
    admin: "Admin",
    superadmin: "Super Admin",
  },
  badges: {
    verified: "Verified",
    unverified: "Unverified",
  },
  modal: {
    title: "Add New Admin",
    subtitle:
      "Enter the email address of the member you want to promote to admin.",
    label: "Email Address",
    placeholder: "user@example.com",
    cancel: "Cancel",
    promote: "Promote to Admin",
  },
  confirmPromote: {
    title: "Promote to Admin",
    message: "Are you sure you want to promote {email} to admin?",
  },
  confirmDemote: {
    title: "Remove Admin Access",
    message:
      "Are you sure you want to remove admin access from {name} ({email})? They will become a regular member.",
  },
} as const;
