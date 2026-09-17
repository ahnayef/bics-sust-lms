import { USER_ROLES, UserRole } from "@/lib/constants";

import { getProfile } from "@/server/geo";
import { getClaims } from "@/server/user";
import { cache } from "react";

export const getAuthUser = cache(async () => {
  const claims = await getClaims();
  if (!claims?.sub) return null;
  return {
    id: claims.sub as string,
    email: (claims.email as string) ?? null,
    user_metadata: (claims.user_metadata as Record<string, unknown>) ?? {},
    app_metadata: (claims.app_metadata as Record<string, unknown>) ?? {},
    role: (claims.role as string) ?? null,
  };
});

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export const getMyProfile = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;
  return getProfile(user.id);
});

export async function requireRole(roles: UserRole[]) {
  const profile = await getMyProfile();
  if (!profile || !roles.includes(profile.role as UserRole)) {
    throw new Error("Insufficient permissions");
  }
  return profile;
}

export async function isAdmin() {
  const profile = await getMyProfile();
  return profile?.role === USER_ROLES.ADMIN;
}

export async function isModerator() {
  const profile = await getMyProfile();
  return (
    profile?.role === USER_ROLES.MODERATOR || profile?.role === USER_ROLES.ADMIN
  );
}
