/*
  # SkillBridge Database Schema

  ## Overview
  Creates the complete database structure for the SkillBridge platform connecting volunteers with NGOs.

  ## New Tables
  
  ### 1. users
  - `id` (uuid, primary key) - Unique identifier, auto-generated
  - `email` (text, unique, required) - User's email address
  - `name` (text, required) - Full name of the user
  - `role` (text, required) - User type: 'volunteer' or 'ngo'
  - `skills` (jsonb) - Array of skills (for volunteers) or empty for NGOs
  - `location` (text) - User's geographical location
  - `bio` (text) - Short biography or summary
  - `organization_name` (text) - NGO name (NGO-specific)
  - `organization_description` (text) - NGO description (NGO-specific)
  - `website_url` (text) - NGO website (NGO-specific)
  - `created_at` (timestamptz) - Account creation timestamp

  ### 2. opportunities
  - `id` (uuid, primary key) - Unique identifier for the opportunity
  - `ngo_id` (uuid, foreign key) - Reference to the NGO user who posted it
  - `title` (text, required) - Opportunity title
  - `description` (text, required) - Detailed information
  - `required_skills` (jsonb) - Array of required skills
  - `duration` (text) - Duration description (e.g., "3 weeks", "10 hours/week")
  - `location` (text) - Location where opportunity is based
  - `status` (text) - Current state: 'open' or 'closed'
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. applications
  - `id` (uuid, primary key) - Unique identifier for the application
  - `opportunity_id` (uuid, foreign key) - Reference to the opportunity
  - `volunteer_id` (uuid, foreign key) - Reference to the volunteer user
  - `status` (text) - Application status: 'pending', 'accepted', or 'rejected'
  - `cover_letter` (text) - Volunteer's application message
  - `created_at` (timestamptz) - Application submission timestamp
  - `updated_at` (timestamptz) - Last status update timestamp

  ### 4. messages
  - `id` (uuid, primary key) - Unique identifier for each message
  - `sender_id` (uuid, foreign key) - User ID of message sender
  - `receiver_id` (uuid, foreign key) - User ID of message recipient
  - `content` (text, required) - Message text content
  - `read` (boolean) - Whether message has been read
  - `created_at` (timestamptz) - Message sent timestamp

  ## Security
  - RLS (Row Level Security) enabled on all tables
  - Policies ensure users can only access their own data and related records
  - Volunteers can view open opportunities and their own applications
  - NGOs can manage their own opportunities and view applications for them
  - Messages are only accessible to sender and receiver
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('volunteer', 'ngo')),
  skills jsonb DEFAULT '[]'::jsonb,
  location text DEFAULT '',
  bio text DEFAULT '',
  organization_name text DEFAULT '',
  organization_description text DEFAULT '',
  website_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  required_skills jsonb DEFAULT '[]'::jsonb,
  duration text DEFAULT '',
  location text DEFAULT '',
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  cover_letter text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(opportunity_id, volunteer_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Opportunities policies
CREATE POLICY "Anyone can view open opportunities"
  ON opportunities FOR SELECT
  TO authenticated
  USING (status = 'open' OR ngo_id = auth.uid());

CREATE POLICY "NGOs can create opportunities"
  ON opportunities FOR INSERT
  TO authenticated
  WITH CHECK (
    ngo_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ngo')
  );

CREATE POLICY "NGOs can update own opportunities"
  ON opportunities FOR UPDATE
  TO authenticated
  USING (ngo_id = auth.uid())
  WITH CHECK (ngo_id = auth.uid());

CREATE POLICY "NGOs can delete own opportunities"
  ON opportunities FOR DELETE
  TO authenticated
  USING (ngo_id = auth.uid());

-- Applications policies
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    volunteer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE opportunities.id = applications.opportunity_id
      AND opportunities.ngo_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    volunteer_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'volunteer')
  );

CREATE POLICY "NGOs can update application status"
  ON applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE opportunities.id = applications.opportunity_id
      AND opportunities.ngo_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM opportunities
      WHERE opportunities.id = applications.opportunity_id
      AND opportunities.ngo_id = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_opportunities_ngo_id ON opportunities(ngo_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_volunteer_id ON applications(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
