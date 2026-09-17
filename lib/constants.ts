export const USER_ROLES = {
  MEMBER: "member",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
  MODERATOR: "moderator", // Legacy fallback
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const RANK_TYPES = {
  NONE: "None",
  MEMBER: "Member",
  ASSOCIATE: "Associate",
  SUPPORTER: "Supporter",
} as const;

export const TRANSACTION_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  OVERDUE: "overdue",
  COMPLETED: "completed",
  REJECTED: "rejected",
} as const;

export const COPY_STATUS = {
  AVAILABLE: "available",
  BORROWED: "borrowed",
  DAMAGED: "damaged",
} as const;

export const ROLE_COLORS = {
  [USER_ROLES.SUPERADMIN]: "text-purple-700 bg-purple-100 border-purple-300",
  [USER_ROLES.ADMIN]: "text-red-600 bg-red-100 border-red-200",
  [USER_ROLES.MODERATOR]: "text-amber-600 bg-amber-100 border-amber-200",
  [USER_ROLES.MEMBER]: "text-emerald-600 bg-emerald-100 border-emerald-200",
};

export const TRANSACTION_STATUS_COLORS = {
  [TRANSACTION_STATUS.PENDING]: "text-blue-600 bg-blue-100 border-blue-200",
  [TRANSACTION_STATUS.ACTIVE]:
    "text-emerald-600 bg-emerald-100 border-emerald-200",
  [TRANSACTION_STATUS.OVERDUE]: "text-red-600 bg-red-100 border-red-200",
  [TRANSACTION_STATUS.COMPLETED]: "text-gray-600 bg-gray-100 border-gray-200",
  [TRANSACTION_STATUS.REJECTED]: "text-rose-600 bg-rose-100 border-rose-200",
};
