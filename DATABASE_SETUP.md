# Database Setup Instructions

This app uses Neon PostgreSQL to track visitor analytics and quilt downloads.

## Setup Steps

1. **Run the SQL scripts** to create the required tables:
   - Navigate to the `scripts` folder in the file browser
   - Click on `001_create_visitors_table.sql` and click the "Run" button
   - Click on `002_create_quilts_table.sql` and click the "Run" button

2. **Verify tables are created**:
   - The `visitors` table tracks unique visitors and generation counts
   - The `quilts` table stores metadata for downloaded quilts

## Tables

### visitors
- `session_id` (TEXT, PRIMARY KEY): Unique session identifier
- `first_visit` (TIMESTAMP): First time the visitor accessed the app
- `last_visit` (TIMESTAMP): Most recent visit
- `generation_count` (INTEGER): Number of quilt layouts generated
- `created_at` (TIMESTAMP): Record creation time

### quilts
- `id` (SERIAL, PRIMARY KEY): Auto-incrementing ID
- `session_id` (TEXT): Visitor session ID
- `blob_url` (TEXT): URL to the quilt image in Vercel Blob storage
- `grid_rows` (INTEGER): Number of rows in the quilt
- `grid_cols` (INTEGER): Number of columns in the quilt
- `unique_patterns` (INTEGER): Number of unique patterns used
- `total_tiles` (INTEGER): Total number of tiles in the quilt
- `downloaded_at` (TIMESTAMP): When the quilt was downloaded

## Error Handling

The app includes graceful error handling:
- If tables don't exist, analytics will fail silently
- The main app functionality continues to work
- Run the SQL scripts to enable full analytics tracking
