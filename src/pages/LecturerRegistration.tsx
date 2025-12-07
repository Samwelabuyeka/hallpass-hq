
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { UniversitySelector } from '@/components/university-selector';

export function LecturerRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!universityId) {
      toast.error('Please select your university.');
      return;
    }
    if (!courseName) {
        toast.error('Please enter a name for your first course.');
        return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update the user's profile with role and university
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: 'lecturer',
            full_name: fullName,
            university_id: universityId,
          })
          .eq('user_id', data.user.id);

        if (profileError) throw profileError;

        // Create the initial course for the lecturer
        const { error: courseError } = await supabase.from('courses').insert({
          name: courseName,
          code: courseCode || null,
          created_by: data.user.id,
          university_id: universityId,
        });

        if (courseError) throw courseError;

        toast.success('Registration Successful', {
          description: 'Please check your email to verify your account. Your initial course has been created.',
        });
        navigate('/');
      } else {
        throw new Error('User registration did not return a user.');
      }

    } catch (error: any) {
      toast.error('Registration Failed', { description: error.message });
      console.error('Lecturer registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lecturer Registration</CardTitle>
          <CardDescription>Create your account and set up your first course.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="staff-id">Staff ID (Optional)</Label>
              <Input
                id="staff-id"
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              />
            </div>

            <div>
              <Label>University</Label>
              <UniversitySelector
                value={universityId}
                onValueChange={setUniversityId}
                placeholder="Select your university..."
              />
            </div>

            <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Create Your First Course</h3>
                <div>
                  <Label htmlFor="course-name">Course Name</Label>
                  <Input
                    id="course-name"
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g., Introduction to AI"
                    required
                  />
                </div>
                <div className="mt-4">
                  <Label htmlFor="course-code">Course Code (Optional)</Label>
                  <Input
                    id="course-code"
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g., CS404"
                  />
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
