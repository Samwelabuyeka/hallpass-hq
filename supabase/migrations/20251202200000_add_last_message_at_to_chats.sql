
-- Add last_message_at to chats
ALTER TABLE public.chats
ADD COLUMN last_message_at TIMESTAMPTZ NULL;

-- Create a function to update last_message_at
CREATE OR REPLACE FUNCTION public.update_chat_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function on new messages
CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_last_message_at();
