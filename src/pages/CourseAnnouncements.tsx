
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function CourseAnnouncements() {
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('name')
          .eq('id', courseId)
          .single();
        if (error) throw error;
        setCourseName(data.name);
      } catch (error: any) {
        toast.error('Failed to fetch course details', { description: error.message });
        navigate('/lecturer-dashboard');
      }
    };
    fetchCourseDetails();
  }, [courseId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !courseId || !title || !content) {
      toast.error('All fields are required');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Insert the announcement
      const { data: announcement, error: announcementError } = await supabase
        .from('announcements')
        .insert({
          course_id: courseId,
          lecturer_user_id: user.id,
          title,
          content,
        })
        .select('id')
        .single();

      if (announcementError) throw announcementError;

      // Step 2: Trigger a Supabase Edge Function to notify students.
      // This is more robust than trying to fetch all students on the client.
      const { error: functionError } = await supabase.functions.invoke('notify-course-students', {
        body: { announcementId: announcement.id },
      });

      if (functionError) {
        // Even if function fails, the announcement is still created.
        toast.warning('Announcement created, but failed to send notifications.', {
          description: functionError.message,
        });
      } else {
        toast.success('Announcement sent successfully!');
      }
      
      navigate(`/lecturer-dashboard`);

    } catch (error: any) {
      toast.error('Failed to send announcement', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Announcement for {courseName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Announcement'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
