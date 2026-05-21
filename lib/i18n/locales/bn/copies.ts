export const copies = {
  title: "কপি ব্যবস্থাপনা",
  subtitle: "বইয়ের কপিগুলো পরিচালনা করুন এবং কিউআর কোড তৈরি করুন।",
  stats: {
    total: "মোট কপি",
    available: "উপলব্ধ",
    borrowed: "ধারে দেওয়া",
    damaged: "ক্ষতিগ্রস্ত",
  },
  filters: {
    searchPlaceholder: "কপি আইডি, শিরোনাম বা লেখক দিয়ে খুঁজুন...",
    all: "সব অবস্থা",
    available: "উপলব্ধ",
    borrowed: "ধারে দেওয়া",
    damaged: "ক্ষতিগ্রস্ত",
  },
  actions: {
    addCopy: "কপি যুক্ত করুন",
    downloadQr: "কিউআর ডাউনলোড",
    delete: "ডিলিট",
  },
  table: {
    copyId: "কপি আইডি",
    bookTitle: "বইয়ের শিরোনাম",
    status: "অবস্থা",
    actions: "অ্যাকশন",
  },
  empty: "এই অনুসন্ধান বা ফিল্টারের সাথে কোনো কপি মেলেনি।",
  modal: {
    addTitle: "নতুন কপি যুক্ত করুন",
    labels: {
      selectBook: "বই নির্বাচন করুন",
    },
    placeholders: {
      searchBook: "শিরোনাম বা লেখক দিয়ে বই খুঁজুন...",
      selectBook: "তালিকা থেকে একটি বই নির্বাচন করুন",
    },
    cancel: "বাতিল করুন",
    add: "কপি যুক্ত করুন",
  },
  qrModal: {
    title: "কিউআর আইডেন্টিটি কার্ড",
    download: "পিএনজি ডাউনলোড",
    close: "বন্ধ করুন",
    loading: "কার্ড তৈরি হচ্ছে...",
    copyId: "কপি আইডি",
  },
  flash: {
    addSuccess: "নতুন কপিটি সফলভাবে যুক্ত করা হয়েছে।",
    deleteSuccess: "কপিটি সফলভাবে মুছে ফেলা হয়েছে।",
  },
  confirmDelete: {
    title: "কপি মুছে ফেলুন",
    message: "আপনি কি নিশ্চিত যে আপনি এই কপিটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।",
    warning: "এই কপিটি বর্তমানে {count} টি ট্রানজ্যাকশনে ব্যবহৃত হচ্ছে। এটি মুছে ফেললে তথ্যের অসামঞ্জস্যতা দেখা দিতে পারে।",
  },
} as const;
