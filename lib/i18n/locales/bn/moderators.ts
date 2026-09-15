export const moderators = {
  title: "মডারেটরবৃন্দ",
  subtitle: "উচ্চতর অ্যাক্সেস সহ অ্যাডমিন এবং মডারেটর অ্যাকাউন্টসমূহ।",
  actions: {
    add: "মডারেটর যুক্ত করুন",
    remove: "মুছে ফেলুন",
  },
  filters: {
    searchPlaceholder: "নাম বা ইমেইল দিয়ে খুঁজুন...",
  },
  empty: "কোনো ফলাফল পাওয়া যায়নি।",
  roles: {
    admin: "অ্যাডমিন",
    moderator: "মডারেটর",
  },
  badges: {
    verified: "যাচাইকৃত",
    unverified: "অযাচাইকৃত",
  },
  modal: {
    title: "নতুন মডারেটর যুক্ত করুন",
    subtitle: "যাকে মডারেটর করতে চান তার ইমেইল ঠিকানা লিখুন।",
    label: "ইমেইল ঠিকানা",
    placeholder: "user@example.com",
    cancel: "বাতিল করুন",
    promote: "মডারেটর হিসেবে নিয়োগ দিন",
  },
  confirmPromote: {
    title: "মডারেটর নিয়োগ",
    message: "আপনি কি নিশ্চিত যে আপনি {email}-কে মডারেটর হিসেবে নিয়োগ দিতে চান?",
  },
  confirmDemote: {
    title: "মডারেটর অ্যাক্সেস অপসারণ",
    message: "আপনি কি নিশ্চিত যে আপনি {name} ({email})-এর মডারেটর অ্যাক্সেস সরিয়ে নিতে চান? তিনি একজন সাধারণ সদস্য হয়ে যাবেন।",
  },
} as const;
