
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export function LecturerRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffId, setStaffId] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            // Initial profile data
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Update the user's profile to set the role to 'lecturer'
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: 'lecturer',
            full_name: fullName,
            // In a real scenario, you'd likely have a university_id and staff_id
          })
          .eq('user_id', data.user.id);

        if (profileError) throw profileError;

        toast.success('Registration Successful', {
          description: 'Please check your email to verify your account.',
        });
        navigate('/login'); // Redirect to login after successful registration
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
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Lecturer Registration</CardTitle>
          <CardDescription>Create your account to connect with students and manage your courses.</CardDescription>
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
