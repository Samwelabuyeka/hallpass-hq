
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request) {
  const { record: course } = await request.json();

  if (!course) {
    return new Response(JSON.stringify({ error: 'Course record is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Create the new course channel chat
    const { data: chatData, error: chatError } = await supabaseAdmin
      .from('chats')
      .insert({
        name: `${course.name} Channel`,
        type: 'course_channel',
        course_id: course.id,
        created_by: course.created_by, // Assuming course creator is passed
      })
      .select('id')
      .single();

    if (chatError) throw chatError;
    const chatId = chatData.id;

    // 2. Add the creator as the first participant
    if (course.created_by) {
        const { error: participantError } = await supabaseAdmin
            .from('chat_participants')
            .insert({ chat_id: chatId, user_id: course.created_by });
        if (participantError) {
            console.error('Failed to add creator to course channel:', participantError);
        }
    }

    return new Response(JSON.stringify({ success: true, chatId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
