import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, ilike, inArray, ne } from "drizzle-orm";

function transformProfile(profile: any) {
  return {
    ...profile,
    rank: profile.rank ?? undefined,
    thana: profile.thana ?? undefined,
    category: profile.category ?? undefined,
    created_at: profile.created_at
      ? new Date(profile.created_at).toISOString()
      : null,
    updated_at: profile.updated_at
      ? new Date(profile.updated_at).toISOString()
      : null,
  };
}

export async function getProfileById(id: string) {
  const data = await db.query.profiles.findFirst({
    where: eq(schema.profiles.id, id),
    with: { thana: true, rank: true, category: true },
  });
  return data ? transformProfile(data) : null;
}

export async function getProfileByUsername(username: string) {
  const data = await db.query.profiles.findFirst({
    where: ilike(schema.profiles.username, username),
    with: { thana: true, rank: true },
  });
  return data ? transformProfile(data) : null;
}

export async function getProfileByEmail(email: string) {
  const data = await db.query.profiles.findFirst({
    where: eq(schema.profiles.email, email),
  });
  return data ? transformProfile(data) : null;
}

export async function getProfileByUsernameExcludingId(
  username: string,
  excludeId: string,
) {
  const data = await db.query.profiles.findFirst({
    where: and(
      eq(schema.profiles.username, username),
      ne(schema.profiles.id, excludeId),
    ),
  });
  return data ? transformProfile(data) : null;
}

export async function getAllProfiles() {
  const data = await db.query.profiles.findMany({
    with: { thana: true, rank: true },
    orderBy: (profiles, { desc }) => [desc(profiles.created_at)],
  });
  return data.map(transformProfile);
}

export async function getModeratorsAndAdmin() {
  const data = await db.query.profiles.findMany({
    where: inArray(schema.profiles.role, ["admin", "moderator"]),
    with: { rank: true },
    orderBy: (profiles, { asc }) => [asc(profiles.created_at)],
  });

  const transformed = data.map(transformProfile);
  // Strictly hide superadmin from the staff directory list
  return transformed
    .filter((p) => p.role !== "superadmin")
    .sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (a.role !== "admin" && b.role === "admin") return 1;
      return 0;
    });
}

export const getAdminsList = getModeratorsAndAdmin;

export async function checkUsernameAvailable(
  username: string,
): Promise<boolean> {
  const data = await db.query.profiles.findFirst({
    where: eq(schema.profiles.username, username),
    columns: { id: true },
  });
  return data === null;
}

export async function upsertProfile(
  profile: typeof schema.profiles.$inferInsert,
) {
  return db.insert(schema.profiles).values(profile).onConflictDoUpdate({
    target: schema.profiles.id,
    set: profile,
  });
}

export async function updateProfile(
  id: string,
  updates: Partial<typeof schema.profiles.$inferInsert>,
) {
  return db
    .update(schema.profiles)
    .set({ ...updates, updated_at: new Date() })
    .where(eq(schema.profiles.id, id));
}
