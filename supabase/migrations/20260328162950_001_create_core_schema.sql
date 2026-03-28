/*
  # HERAKL Core Database Schema

  1. New Tables
    - `properties` (bien) - Main property records
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `address` (jsonb) - Street, city, postal code
      - `property_type` (text) - maison, appartement, immeuble, terrain
      - `surface` (integer) - m²
      - `rooms` (text) - T1, T2, T3, etc.
      - `construction_year` (integer)
      - `plu_zone` (text) - Urbanization zone
      - `access_level` (text) - pending, restricted, full
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `property_analysis` - Analysis results (DPE, valuation, risks)
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `global_score` (integer) - 0-100
      - `structure_score` (integer)
      - `risk_score` (integer)
      - `energy_score` (integer)
      - `synthesis` (text)
      - `analysis_data` (jsonb) - Complete analysis JSON
      - `created_at` (timestamptz)

    - `property_context` - Market & location context
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `price_per_m2` (integer)
      - `estimated_value_low` (integer)
      - `estimated_value_high` (integer)
      - `region` (text)
      - `market_tension` (text)
      - `updated_at` (timestamptz)

    - `property_risks` - Risk assessment
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `flood_risk` (boolean)
      - `seismic_level` (text) - faible, moyen, fort
      - `clay_risk` (boolean)
      - `radon_risk` (boolean)
      - `urbanization_constraints` (text)
      - `assessed_at` (timestamptz)

    - `property_energy` - Energy performance
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `dpe_class` (text) - A-G
      - `is_estimated` (boolean)
      - `annual_consumption` (integer) - kWh
      - `heating_source` (text)
      - `updated_at` (timestamptz)

    - `property_documents` - Document storage metadata
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `document_name` (text)
      - `document_type` (text) - DPE, tax, insurance, etc.
      - `file_path` (text) - Path in Supabase Storage
      - `file_size` (integer) - bytes
      - `uploaded_by` (uuid, foreign key to auth.users)
      - `uploaded_at` (timestamptz)

    - `property_history` - Work/renovation history
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `event_type` (text) - travaux, inspection, permit, sale
      - `title` (text)
      - `description` (text)
      - `event_date` (date)
      - `amount` (integer) - Cost in € if applicable
      - `created_at` (timestamptz)

    - `property_verification` - Verification status
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `verification_status` (text) - pending, verified, rejected
      - `user_relationship` (text) - proprietaire, bailleur, etc.
      - `justification_method` (text) - taxe-fonciere, titre, etc.
      - `document_id` (uuid, foreign key to property_documents)
      - `submitted_at` (timestamptz)
      - `reviewed_at` (timestamptz)
      - `reviewed_by` (uuid) - Admin user

    - `share_links` - Shareable property access links
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `creator_id` (uuid, foreign key to auth.users)
      - `access_token` (text, unique) - Random token for URL
      - `access_role` (text) - viewer, depot
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `accessed_count` (integer, default 0)

    - `property_collaborators` - Team access & roles
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `collaborator_id` (uuid, foreign key to auth.users)
      - `role` (text) - owner, editor, viewer
      - `invited_at` (timestamptz)
      - `accepted_at` (timestamptz)
      - `invited_by` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own properties
    - Properties cannot be deleted (only archived)
    - Verification handled by admin role
    - Share links are public-readable via token
    - Collaborators can access shared properties

  3. Indexes
    - user_id for fast lookup of user's properties
    - access_token for share link validation
    - property_id for all foreign key relationships
*/

-- Create enum types
CREATE TYPE property_type_enum AS ENUM ('maison', 'appartement', 'immeuble', 'terrain');
CREATE TYPE access_level_enum AS ENUM ('pending', 'restricted', 'full');
CREATE TYPE dpe_class_enum AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G');
CREATE TYPE seismic_level_enum AS ENUM ('faible', 'moyen', 'fort');
CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE collaborator_role_enum AS ENUM ('owner', 'editor', 'viewer');
CREATE TYPE share_role_enum AS ENUM ('viewer', 'depot');

-- Main properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address jsonb NOT NULL, -- {street, city, postal_code, full}
  property_type property_type_enum NOT NULL,
  surface integer NOT NULL, -- m²
  rooms text NOT NULL, -- T1, T2, etc.
  construction_year integer,
  plu_zone text,
  access_level access_level_enum DEFAULT 'pending'::access_level_enum,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Property analysis results
CREATE TABLE IF NOT EXISTS property_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  global_score integer CHECK (global_score >= 0 AND global_score <= 100),
  structure_score integer CHECK (structure_score >= 0 AND structure_score <= 100),
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100),
  energy_score integer CHECK (energy_score >= 0 AND energy_score <= 100),
  synthesis text,
  analysis_data jsonb, -- Complete analysis results
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Market context
CREATE TABLE IF NOT EXISTS property_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  price_per_m2 integer,
  estimated_value_low integer,
  estimated_value_high integer,
  region text,
  market_tension text,
  updated_at timestamptz DEFAULT now()
);

-- Risk assessment
CREATE TABLE IF NOT EXISTS property_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  flood_risk boolean DEFAULT false,
  seismic_level seismic_level_enum,
  clay_risk boolean DEFAULT false,
  radon_risk boolean DEFAULT false,
  urbanization_constraints text,
  assessed_at timestamptz DEFAULT now()
);

-- Energy performance
CREATE TABLE IF NOT EXISTS property_energy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  dpe_class dpe_class_enum,
  is_estimated boolean DEFAULT true,
  annual_consumption integer, -- kWh
  heating_source text,
  updated_at timestamptz DEFAULT now()
);

-- Document metadata
CREATE TABLE IF NOT EXISTS property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Renovation/event history
CREATE TABLE IF NOT EXISTS property_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  event_date date,
  amount integer,
  created_at timestamptz DEFAULT now()
);

-- Property verification
CREATE TABLE IF NOT EXISTS property_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  verification_status verification_status_enum DEFAULT 'pending'::verification_status_enum,
  user_relationship text NOT NULL,
  justification_method text NOT NULL,
  document_id uuid REFERENCES property_documents(id) ON DELETE SET NULL,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Shareable links
CREATE TABLE IF NOT EXISTS share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL UNIQUE,
  access_role share_role_enum DEFAULT 'viewer'::share_role_enum,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  accessed_count integer DEFAULT 0
);

-- Property collaborators
CREATE TABLE IF NOT EXISTS property_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role collaborator_role_enum DEFAULT 'viewer'::collaborator_role_enum,
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(property_id, collaborator_id)
);

-- Create indexes
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_property_analysis_property_id ON property_analysis(property_id);
CREATE INDEX idx_property_context_property_id ON property_context(property_id);
CREATE INDEX idx_property_risks_property_id ON property_risks(property_id);
CREATE INDEX idx_property_energy_property_id ON property_energy(property_id);
CREATE INDEX idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX idx_property_history_property_id ON property_history(property_id);
CREATE INDEX idx_share_links_token ON share_links(access_token);
CREATE INDEX idx_share_links_property_id ON share_links(property_id);
CREATE INDEX idx_collaborators_property_id ON property_collaborators(property_id);
CREATE INDEX idx_collaborators_collaborator_id ON property_collaborators(collaborator_id);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_energy ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies: properties table
CREATE POLICY "Users can create their own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM property_collaborators
      WHERE property_collaborators.property_id = properties.id
      AND property_collaborators.collaborator_id = auth.uid()
      AND property_collaborators.accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Users can update their own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Properties cannot be deleted (archive only)"
  ON properties FOR DELETE
  TO authenticated
  USING (false);

-- RLS Policies: property_analysis (inherits from properties)
CREATE POLICY "Users can view analysis of accessible properties"
  ON property_analysis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_analysis.property_id
      AND (
        properties.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM property_collaborators
          WHERE property_collaborators.property_id = properties.id
          AND property_collaborators.collaborator_id = auth.uid()
          AND property_collaborators.accepted_at IS NOT NULL
        )
      )
    )
  );

CREATE POLICY "Property owners can update analysis"
  ON property_analysis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_analysis.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- RLS Policies: property_context (similar to analysis)
CREATE POLICY "Users can view context of accessible properties"
  ON property_context FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_context.property_id
      AND (
        properties.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM property_collaborators
          WHERE property_collaborators.property_id = properties.id
          AND property_collaborators.collaborator_id = auth.uid()
          AND property_collaborators.accepted_at IS NOT NULL
        )
      )
    )
  );

CREATE POLICY "Property owners can insert context"
  ON property_context FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_context.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- RLS Policies: property_risks
CREATE POLICY "Users can view risks of accessible properties"
  ON property_risks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_risks.property_id
      AND (
        properties.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM property_collaborators
          WHERE property_collaborators.property_id = properties.id
          AND property_collaborators.collaborator_id = auth.uid()
          AND property_collaborators.accepted_at IS NOT NULL
        )
      )
    )
  );

CREATE POLICY "Property owners can insert risks"
  ON property_risks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_risks.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- RLS Policies: property_energy
CREATE POLICY "Users can view energy of accessible properties"
  ON property_energy FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_energy.property_id
      AND (
        properties.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM property_collaborators
          WHERE property_collaborators.property_id = properties.id
          AND property_collaborators.collaborator_id = auth.uid()
          AND property_collaborators.accepted_at IS NOT NULL
        )
      )
    )
  );

CREATE POLICY "Property owners can insert energy"
  ON property_energy FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_energy.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- RLS Policies: property_documents
CREATE POLICY "Users can view docs of accessible properties"
  ON property_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_documents.property_id
      AND (
        properties.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM property_collaborators
          WHERE property_collaborators.property_id = properties.id
          AND property_collaborators.collaborator_id = auth.uid()
          AND property_collaborators.accepted_at IS NOT NULL
        )
      )
    )
  );

CREATE POLICY "Users can upload docs to accessible properties"
  ON property_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_documents.property_id
      AND (
        properties.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM property_collaborators
          WHERE property_collaborators.property_id = properties.id
          AND property_collaborators.collaborator_id = auth.uid()
          AND property_collaborators.role IN ('owner', 'editor')
        )
      )
    )
  );

-- RLS Policies: property_history
CREATE POLICY "Users can view history of accessible properties"
  ON property_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_history.property_id
      AND (
        properties.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM property_collaborators
          WHERE property_collaborators.property_id = properties.id
          AND property_collaborators.collaborator_id = auth.uid()
          AND property_collaborators.accepted_at IS NOT NULL
        )
      )
    )
  );

CREATE POLICY "Users can add history to accessible properties"
  ON property_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_history.property_id
      AND (
        properties.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM property_collaborators
          WHERE property_collaborators.property_id = properties.id
          AND property_collaborators.collaborator_id = auth.uid()
          AND property_collaborators.role IN ('owner', 'editor')
        )
      )
    )
  );

-- RLS Policies: property_verification
CREATE POLICY "Users can view verification of own properties"
  ON property_verification FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_verification.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit verification"
  ON property_verification FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_verification.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- RLS Policies: share_links (public by token)
CREATE POLICY "Share links are readable by token"
  ON share_links FOR SELECT
  USING (true);

CREATE POLICY "Property owners can create share links"
  ON share_links FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = share_links.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- RLS Policies: property_collaborators
CREATE POLICY "Property owners can manage collaborators"
  ON property_collaborators FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_collaborators.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their collaborations"
  ON property_collaborators FOR SELECT
  TO authenticated
  USING (
    collaborator_id = auth.uid() OR
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_collaborators.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can accept invitations"
  ON property_collaborators FOR UPDATE
  TO authenticated
  USING (collaborator_id = auth.uid())
  WITH CHECK (collaborator_id = auth.uid());
