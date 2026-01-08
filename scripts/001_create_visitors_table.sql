-- Create table to track unique visitors and their quilt generations
CREATE TABLE IF NOT EXISTS visitors (
  session_id TEXT PRIMARY KEY,
  first_visit TIMESTAMP NOT NULL DEFAULT NOW(),
  last_visit TIMESTAMP NOT NULL DEFAULT NOW(),
  generation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_visitors_last_visit ON visitors(last_visit);
