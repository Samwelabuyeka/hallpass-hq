import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Registration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState('');
  const [combination, setCombination] = useState('');
  const [isEducation, setIsEducation] = useState(false);

  const handleCourseChange = (e) => {
    const newCourse = e.target.value;
    setCourse(newCourse);
    if (newCourse.toLowerCase() === 'education') {
      setIsEducation(true);
    } else {
      setIsEducation(false);
      setCombination('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      console.error('User not logged in');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          course: course,
          combination: combination,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      navigate('/chat'); // Redirect to chat after successful registration
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="course">Course</Label>
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
                  placeholder="e.g., Math/Physics"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
