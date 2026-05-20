import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { USER_ROLES, UserRole } from "@/lib/constants";

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function getMyProfile() {
  const user = await getAuthUser();
  if (!user) return null;

  return db.query.profiles.findFirst({
    where: eq(schema.profiles.id, user.id),
  });
}

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
  return profile?.role === USER_ROLES.MODERATOR || profile?.role === USER_ROLES.ADMIN;
}
