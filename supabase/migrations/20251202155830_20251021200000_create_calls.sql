DROP TABLE IF EXISTS public.calls CASCADE;

-- Create calls table
CREATE TABLE public.calls (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    chat_id bigint NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    caller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    call_type text NOT NULL, -- 'audio' or 'video'
    status text NOT NULL DEFAULT 'initiated', -- 'initiated', 'answered', 'declined', 'missed', 'completed'
    duration integer -- in seconds
);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Policies for calls
-- Users can create calls (initiate)
CREATE POLICY "Users can create their own calls" ON public.calls
    FOR INSERT WITH CHECK (caller_id = auth.uid());

-- Users can see their own calls
CREATE POLICY "Users can view their own calls" ON public.calls
    FOR SELECT USING (caller_id = auth.uid() OR receiver_id = auth.uid());

-- Users can update the status of calls they are involved in
CREATE POLICY "Users can update their calls" ON public.calls
    FOR UPDATE USING (caller_id = auth.uid() OR receiver_id = auth.uid());
