export const moderators = {
  title: "Moderators",
  subtitle: "Admin and moderator accounts with elevated access.",
  actions: {
    add: "Add Moderator",
    remove: "Remove",
  },
  filters: {
    searchPlaceholder: "Search by name or email...",
  },
  empty: "No results found.",
  roles: {
    admin: "Admin",
    moderator: "Moderator",
  },
  badges: {
    verified: "Verified",
    unverified: "Unverified",
  },
  modal: {
    title: "Add New Moderator",
    subtitle: "Enter the email address of the member you want to promote to moderator.",
    label: "Email Address",
    placeholder: "user@example.com",
    cancel: "Cancel",
    promote: "Promote",
  },
  confirmPromote: {
    title: "Promote to Moderator",
    message: "Are you sure you want to promote {email} to moderator?",
  },
  confirmDemote: {
    title: "Remove Moderator Access",
    message: "Are you sure you want to remove moderator access from {name} ({email})? They will become a regular member.",
  },
} as const;
