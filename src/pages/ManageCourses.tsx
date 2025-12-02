
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  name: string;
  code: string | null;
}

export function ManageCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [universityId, setUniversityId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!user) return;

    try {
      // 1. Get user's university_id from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError || !profile) throw new Error('Could not find user profile.');
      setUniversityId(profile.university_id);
      if (!profile.university_id) {
        toast.info('University not set', { description: 'Please set up your university affiliation first.' });
        navigate('/setup'); // Or a profile setup page
        return;
      }

      // 2. Fetch all courses for that university
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, code')
        .eq('university_id', profile.university_id);

      if (coursesError) throw coursesError;
      setAllCourses(coursesData || []);

      // 3. Fetch courses the lecturer is already linked to
      const { data: linkedCourses, error: linkedCoursesError } = await supabase
        .from('lecturer_courses')
        .select('course_id')
        .eq('lecturer_user_id', user.id);
      
      if (linkedCoursesError) throw linkedCoursesError;
      setSelectedCourses(new Set(linkedCourses.map(lc => lc.course_id)));

    } catch (error: any) {
      toast.error('Error fetching courses', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSelectionChange = (courseId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedCourses);
    if (isSelected) {
      newSelection.add(courseId);
    } else {
      newSelection.delete(courseId);
    }
    setSelectedCourses(newSelection);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
        // First, remove all existing links for this lecturer
        const { error: deleteError } = await supabase
            .from('lecturer_courses')
            .delete()
            .eq('lecturer_user_id', user.id);

        if (deleteError) throw deleteError;

        // Then, insert the new set of links
        const newLinks = Array.from(selectedCourses).map(courseId => ({
            lecturer_user_id: user.id,
            course_id: courseId,
        }));

        if (newLinks.length > 0) {
            const { error: insertError } = await supabase
                .from('lecturer_courses')
                .insert(newLinks);
            if (insertError) throw insertError;
        }

      toast.success('Your courses have been updated!');
      navigate('/lecturer-dashboard');

    } catch (error: any) {
      toast.error('Failed to update courses', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Manage Your Courses</CardTitle>
                <p className="text-muted-foreground">Select the courses you are teaching. This will allow you to communicate with the students and representatives of these courses.</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mb-6">
                    {allCourses.length > 0 ? allCourses.map(course => (
                        <div key={course.id} className="flex items-center space-x-2 p-2 border rounded-md">
                            <Checkbox
                                id={course.id}
                                checked={selectedCourses.has(course.id)}
                                onCheckedChange={(checked) => handleSelectionChange(course.id, !!checked)}
                            />
                            <Label htmlFor={course.id} className="flex-grow text-sm font-medium leading-none">
                                {course.name} ({course.code || 'N/A'})
                            </Label>
                        </div>
                    )) : (
                        <p>No courses found for your university. An administrator may need to add them first.</p>
                    )}
                </div>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
