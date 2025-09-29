-- Migration: Add memory tables (without pgvector for now)
-- This migration creates the memory system tables
-- Note: pgvector extension will be added in a future migration when available

-- Create memory_entries table
CREATE TABLE IF NOT EXISTS memory_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  embedding TEXT, -- Store as JSON string for now, will be converted to vector later
  first_met TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 0,
  introduced_by TEXT,
  notes TEXT,
  preferences TEXT[], -- Array of preferences
  tags TEXT[], -- Array of tags
  relationship_type TEXT CHECK (relationship_type IN ('friend', 'family', 'acquaintance')) DEFAULT 'friend',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create interactions table
CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_entry_id TEXT REFERENCES memory_entries(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('meeting', 'recognition', 'conversation')) NOT NULL,
  context TEXT,
  response_generated TEXT,
  emotion TEXT,
  actions TEXT[], -- Array of actions taken
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS memory_entries_name_idx ON memory_entries (name);
CREATE INDEX IF NOT EXISTS memory_entries_last_seen_idx ON memory_entries (last_seen);
CREATE INDEX IF NOT EXISTS memory_entries_relationship_type_idx ON memory_entries (relationship_type);
CREATE INDEX IF NOT EXISTS interactions_memory_entry_id_idx ON interactions (memory_entry_id);
CREATE INDEX IF NOT EXISTS interactions_created_at_idx ON interactions (created_at);
CREATE INDEX IF NOT EXISTS interactions_interaction_type_idx ON interactions (interaction_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_memory_entries_updated_at ON memory_entries;
CREATE TRIGGER update_memory_entries_updated_at
    BEFORE UPDATE ON memory_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- Uncomment the following lines to insert sample data

/*
INSERT INTO memory_entries (name, embedding, introduced_by, notes, preferences, tags, relationship_type) VALUES
('Anna', '[0.1,0.2,0.3]', 'Sang', 'Met at Sang''s place', ARRAY['coffee', 'books'], ARRAY['friend', 'new_person'], 'friend'),
('Bob', '[0.4,0.5,0.6]', 'Anna', 'Friend of Anna', ARRAY['tea', 'movies'], ARRAY['friend'], 'friend'),
('Charlie', '[0.7,0.8,0.9]', NULL, 'Family member', ARRAY['food'], ARRAY['family'], 'family');

INSERT INTO interactions (memory_entry_id, interaction_type, context, response_generated, emotion, actions) VALUES
((SELECT id FROM memory_entries WHERE name = 'Anna' LIMIT 1), 'meeting', 'First meeting', 'Nice to meet you!', 'happy', ARRAY['wave', 'smile']),
((SELECT id FROM memory_entries WHERE name = 'Bob' LIMIT 1), 'recognition', 'Recognized at party', 'Hello again!', 'excited', ARRAY['hug']);
*/
