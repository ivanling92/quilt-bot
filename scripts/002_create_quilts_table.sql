-- Create table to track downloaded quilts in blob storage
CREATE TABLE IF NOT EXISTS quilts (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  blob_url TEXT NOT NULL,
  grid_rows INTEGER NOT NULL,
  grid_cols INTEGER NOT NULL,
  unique_patterns INTEGER NOT NULL,
  total_tiles INTEGER NOT NULL,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quilts_downloaded_at ON quilts(downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_quilts_session_id ON quilts(session_id);
