-- Add transcript and evaluation columns to session_videos
-- Run with: pnpm run migrate (or apply this file manually)

ALTER TABLE session_videos
    ADD COLUMN IF NOT EXISTS transcript_text TEXT,
    ADD COLUMN IF NOT EXISTS answer_text TEXT,
    ADD COLUMN IF NOT EXISTS expected_expression TEXT,
    ADD COLUMN IF NOT EXISTS evaluation_json JSONB,
    ADD COLUMN IF NOT EXISTS score NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS evaluation_status VARCHAR(20) NOT NULL DEFAULT 'pending';

COMMENT ON COLUMN session_videos.transcript_text IS 'Raw transcription from Whisper/WhisperX';
COMMENT ON COLUMN session_videos.answer_text IS 'Extracted/summarized answer text';
COMMENT ON COLUMN session_videos.expected_expression IS 'What a strong answer would typically include (from LLM)';
COMMENT ON COLUMN session_videos.evaluation_json IS 'LLM evaluation output (criteria, feedback, etc.)';
COMMENT ON COLUMN session_videos.score IS 'Score out of 10';
COMMENT ON COLUMN session_videos.evaluation_status IS 'pending | processing | completed | failed';
