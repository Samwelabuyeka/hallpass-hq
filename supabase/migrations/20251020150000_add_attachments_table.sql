CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

ALTER TABLE messages
ADD COLUMN attachment_id UUID,
ADD FOREIGN KEY (attachment_id) REFERENCES attachments(id);