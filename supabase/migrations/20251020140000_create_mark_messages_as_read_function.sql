CREATE OR REPLACE FUNCTION mark_messages_as_read(chat_id_param UUID, user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE chat_id = chat_id_param
  AND user_id != user_id_param
  AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql;