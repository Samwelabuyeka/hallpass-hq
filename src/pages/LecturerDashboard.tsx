
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LecturerDashboardProps {
  profile: any;
}

interface Course {
  id: string;
  name: string;
  description: string;
}

function LecturerDashboard({ profile }: LecturerDashboardProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('created_by', profile.id);

      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        setCourses(data as Course[]);
      }
    };

    fetchCourses();
  }, [profile.id]);

  const handleMessageClassRep = async (courseId: string) => {
    try {
      const { data: chatId, error } = await supabase.rpc('create_or_get_chat_with_class_rep', { p_course_id: courseId });

      if (error) throw error;

      if (chatId) {
        navigate(`/chats?chatId=${chatId}`);
      } else {
        toast.info('This course does not have a designated class representative.');
      }
    } catch (error: any) {
      toast.error('Failed to start chat', { description: error.message });
    }
  };

  return (
    <div>
        <div className="mb-4">
            <Link to="/announcements/create">
            <Button>Create Announcement</Button>
            </Link>
        </div>
      <h2 className="text-2xl font-bold mb-4">Your Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(course => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>{course.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{course.description}</p>
              <Button 
                className="mt-4 w-full" 
                onClick={() => handleMessageClassRep(course.id)}
              >
                Message Class Rep
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default LecturerDashboard;
