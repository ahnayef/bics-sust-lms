export type UserRole = "member" | "moderator" | "admin";
export type UserRank = "None" | "Member" | "Associate" | "Supporter";

export interface Division {
  id: string;
  name: string;
}

export interface District {
  id: string;
  division_id: string;
  name: string;
}

export interface Upazila {
  id: string;
  district_id: string;
  name: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  rank: UserRank;
  division_id: string | null;
  district_id: string | null;
  upazila_id: string | null;
  division?: Division;
  district?: District;
  upazila?: Upazila;
  role: UserRole;
  is_verified: boolean;
  profile_completed: boolean;
  hide_sensitive_info: boolean;
  created_at: string;
  updated_at: string;
}
