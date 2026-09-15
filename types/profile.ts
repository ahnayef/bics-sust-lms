export type UserRole = "member" | "moderator" | "admin";

export interface Thana {
  id: string;
  name: string;
}

export interface Rank {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  rank_id: string | null;
  rank?: Rank;
  thana_id: string | null;
  thana?: Thana;
  role: UserRole;
  is_verified: boolean;
  profile_completed: boolean;
  hide_sensitive_info: boolean;
  created_at: string;
  updated_at: string;
}
