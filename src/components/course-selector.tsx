
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Course {
  id: string;
  name: string;
}

interface CourseSelectorProps {
  universityId: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CourseSelector({ universityId, value, onValueChange, placeholder }: CourseSelectorProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!universityId) {
      setCourses([]);
      return;
    }

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, name')
          .eq('university_id', universityId)
          .order('name', { ascending: true });

        if (error) throw error;
        setCourses(data || []);
      } catch (error: any) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses', { description: 'Please try refreshing the page.' });
      }
      setLoading(false);
    };

    fetchCourses();
  }, [universityId]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={loading || courses.length === 0}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? 'Loading courses...' : (courses.length === 0 ? 'No courses found for this university' : placeholder)} />
      </SelectTrigger>
      <SelectContent>
        {courses.map(course => (
          <SelectItem key={course.id} value={course.id}>
            {course.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
