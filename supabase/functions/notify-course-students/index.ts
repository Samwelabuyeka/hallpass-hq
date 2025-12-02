
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request) {
  const { announcementId } = await request.json();

  if (!announcementId) {
    return new Response(JSON.stringify({ error: 'announcementId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Get the announcement and course details
    const { data: announcement, error: announcementError } = await supabaseAdmin
      .from('announcements')
      .select('title, content, course_id')
      .eq('id', announcementId)
      .single();

    if (announcementError) throw announcementError;

    // 2. Find all students enrolled in that course
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('course_id', announcement.course_id)
      .eq('role', 'student');

    if (studentsError) throw studentsError;
    if (!students || students.length === 0) {
        return new Response(JSON.stringify({ message: 'No students to notify' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // 3. Create a notification for each student
    const notifications = students.map(student => ({
      user_id: student.user_id,
      title: `New Announcement: ${announcement.title}`,
      message: announcement.content,
    }));

    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (notificationError) throw notificationError;

    return new Response(JSON.stringify({ success: true, notified: students.length }), {
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
