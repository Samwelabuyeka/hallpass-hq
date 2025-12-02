
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function Registration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState('');
  const [combination, setCombination] = useState('');
  const [isEducation, setIsEducation] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('university_id, year, semester')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        toast.error('Error fetching profile', { description: 'Please ensure your profile is set up correctly.' });
        navigate('/setup');
      } else {
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, [user, navigate]);

  const handleCourseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCourse = e.target.value;
    setCourse(newCourse);
    setIsEducation(newCourse.toLowerCase().trim() === 'education');
    if (newCourse.toLowerCase().trim() !== 'education') {
        setCombination('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !course) {
      toast.error('Missing information', { description: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    const courseName = course.trim();
    const combinationName = combination.trim();

    try {
        // Step 1: Find or create the course
        let { data: courseData, error: courseError } = await supabase
            .from('courses')
            .select('id')
            .eq('university_id', userProfile.university_id)
            .eq('name', courseName)
            .single();

        if (courseError && courseError.code !== 'PGRST116') throw courseError; // Throw if error is not 'not found'

        if (!courseData) {
            const { data: newCourseData, error: newCourseError } = await supabase
                .from('courses')
                .insert({ university_id: userProfile.university_id, name: courseName })
                .select('id')
                .single();
            if (newCourseError) throw newCourseError;
            courseData = newCourseData;
        }
        
        const courseId = courseData.id;

        // Update user's profile with course_id
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ course_id: courseId })
            .eq('user_id', user.id);

        if (profileUpdateError) throw profileUpdateError;

        // Step 2: Check if a unit set already exists for this course/combination
        let { data: unitSet, error: unitSetError } = await supabase
            .from('course_unit_sets')
            .select('id, units:course_unit_set_units(unit_code, unit_name)')
            .eq('course_id', courseId)
            .eq('year', userProfile.year)
            .eq('semester', userProfile.semester)
            .eq('combination', combinationName)
            .single();
        
        if (unitSetError && unitSetError.code !== 'PGRST116') throw unitSetError;

        if (unitSet) {
            // If set exists, auto-enroll student
            const studentUnits = unitSet.units.map(u => ({
                user_id: user.id,
                unit_code: u.unit_code,
                unit_name: u.unit_name,
                is_active: true,
                semester: userProfile.semester,
                year: userProfile.year,
            }));

            const { error: upsertError } = await supabase.from('student_units').upsert(studentUnits);
            if (upsertError) throw upsertError;

            toast.success('Registration Complete', { description: `You have been enrolled in ${studentUnits.length} units.` });
            navigate('/dashboard');
        } else {
            // If no set exists, redirect to the unit selection page
            toast.info('Define Your Units', { description: 'You are the first to register for this course/combination. Please select your units.' });
            navigate('/unit-selection', { state: { courseId, combination: combinationName } });
        }

    } catch (error: any) {
        toast.error('Registration Failed', { description: error.message || 'An unexpected error occurred.' });
        console.error('Registration error:', error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student Registration</CardTitle>
          <p className="text-muted-foreground">Enter your course details. If you're the first for your course, you'll help define the units for everyone else.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="course">Course Name</Label>
              <Input
                id="course"
                type="text"
                value={course}
                onChange={handleCourseChange}
                placeholder="e.g., Computer Science"
                required
              />
            </div>

            {isEducation && (
              <div>
                <Label htmlFor="combination">Combination</Label>
                <Input
                  id="combination"
                  type="text"
                  value={combination}
                  onChange={(e) => setCombination(e.target.value)}
                  placeholder="e.g., Math/Physics, History/CRE"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Register & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
