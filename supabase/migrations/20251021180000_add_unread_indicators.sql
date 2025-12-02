
-- Add last_read_at to chat_participants
ALTER TABLE public.chat_participants
ADD COLUMN IF NOT EXISTS last_read_at timestamp with time zone DEFAULT now();

-- Function to count unread messages for a user in a chat
CREATE OR REPLACE FUNCTION public.count_unread_messages(p_chat_id uuid, p_user_id uuid)
RETURNS integer AS $$
DECLARE
    unread_count integer;
    last_read timestamp with time zone;
BEGIN
    -- Get the last time the user read this chat
    SELECT last_read_at INTO last_read FROM public.chat_participants
    WHERE chat_id = p_chat_id AND user_id = p_user_id;

    -- If the user has never read the chat, count all messages
    IF last_read IS NULL THEN
        SELECT count(*) INTO unread_count FROM public.messages
        WHERE chat_id = p_chat_id;
    ELSE
        -- Otherwise, count messages created since the last read time
        SELECT count(*) INTO unread_count FROM public.messages
        WHERE chat_id = p_chat_id AND created_at > last_read;
    END IF;

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- We also need a way to update the last_read_at timestamp.
-- Let's create a function that a user can call when they open a chat.
CREATE OR REPLACE FUNCTION public.mark_chat_as_read(p_chat_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.chat_participants
    SET last_read_at = now()
    WHERE chat_id = p_chat_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;
