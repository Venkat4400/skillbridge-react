import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'volunteer' | 'ngo';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  skills: string[];
  location: string;
  bio: string;
  organization_name?: string;
  organization_description?: string;
  website_url?: string;
  created_at: string;
}

export interface Opportunity {
  id: string;
  ngo_id: string;
  title: string;
  description: string;
  required_skills: string[];
  duration: string;
  location: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  ngo?: User;
}

export interface Application {
  id: string;
  opportunity_id: string;
  volunteer_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  cover_letter: string;
  created_at: string;
  updated_at: string;
  opportunity?: Opportunity;
  volunteer?: User;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
}
