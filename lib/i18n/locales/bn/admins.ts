export const admins = {
  title: "অ্যাডমিনবৃন্দ",
  subtitle: "উচ্চতর অ্যাক্সেস সহ অ্যাডমিন অ্যাকাউন্টসমূহ।",
  actions: {
    add: "অ্যাডমিন যুক্ত করুন",
    remove: "মুছে ফেলুন",
  },
  filters: {
    searchPlaceholder: "নাম বা ইমেইল দিয়ে খুঁজুন...",
  },
  empty: "কোনো ফলাফল পাওয়া যায়নি।",
  roles: {
    admin: "অ্যাডমিন",
    superadmin: "সুপার অ্যাডমিন",
  },
  badges: {
    verified: "যাচাইকৃত",
    unverified: "অযাচাইকৃত",
  },
  modal: {
    title: "নতুন অ্যাডমিন যুক্ত করুন",
    subtitle: "যাকে অ্যাডমিন করতে চান তার ইমেইল ঠিকানা লিখুন।",
    label: "ইমেইল ঠিকানা",
    placeholder: "user@example.com",
    cancel: "বাতিল করুন",
    promote: "অ্যাডমিন হিসেবে নিয়োগ দিন",
  },
  confirmPromote: {
    title: "অ্যাডমিন নিয়োগ",
    message:
      "আপনি কি নিশ্চিত যে আপনি {email}-কে অ্যাডমিন হিসেবে নিয়োগ দিতে চান?",
  },
  confirmDemote: {
    title: "অ্যাডমিন অ্যাক্সেস অপসারণ",
    message:
      "আপনি কি নিশ্চিত যে আপনি {name} ({email})-এর অ্যাডমিন অ্যাক্সেস সরিয়ে নিতে চান? তিনি একজন সাধারণ সদস্য হয়ে যাবেন।",
  },
} as const;
