export type EducationLevel = 'btech' | 'bca' | 'mca' | 'bsc' | 'msc' | 'other';
export type HackathonMode = 'online' | 'offline' | 'hybrid';
export type HackathonSource = 'mlh' | 'devfolio' | 'unstop' | 'devpost' | 'community';
export type InviteStatus = 'pending' | 'accepted' | 'rejected';
export type NotificationType = 'team_invite' | 'invite_accepted' | 'invite_rejected' | 'deadline_reminder';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  education: EducationLevel;
  skills: string[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hackathon {
  id: string;
  title: string;
  description: string | null;
  source: HackathonSource;
  mode: HackathonMode;
  registration_url: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  prize_pool: string | null;
  skills: string[];
  location: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedHackathon {
  id: string;
  user_id: string;
  hackathon_id: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  hackathon_id: string | null;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface TeamInvite {
  id: string;
  sender_id: string;
  receiver_id: string;
  team_id: string | null;
  status: InviteStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// Extended types with joins
export interface TeamInviteWithProfiles extends TeamInvite {
  sender: Profile;
  receiver: Profile;
}

export interface SavedHackathonWithDetails extends SavedHackathon {
  hackathon: Hackathon;
}
